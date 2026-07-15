import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { apiFetch } from '@/lib/api-client';
import type { User, UserRole } from '@/types/auth.types';

interface ProtectedRouteProps {
    readonly children: React.ReactNode;
    readonly role?: UserRole;
}

function roleFallback(role: UserRole | undefined): string {
    if (role === "PROFESSIONAL") return "/psicologo";
    if (role === "ADMIN") return "/admin";
    return "/panel";
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
    const [status, setStatus] = useState<"checking" | "ok" | "rejected">("checking");

    useEffect(() => {
        // No token at all — reject immediately.
        if (!authService.isAuthenticated()) {
            setStatus("rejected");
            return;
        }

        // Verify the token is still accepted by the server (catches deactivated users).
        apiFetch<User>("/users/me/")
            .then((user) => {
                // Update local cache so UI reflects latest server state.
                const stored = authService.getUser();
                if (stored) {
                    authService.setSession({
                        access: authService.getAccessToken()!,
                        refresh: localStorage.getItem("auth_refresh_token") ?? "",
                        user,
                    });
                }
                setStatus("ok");
            })
            .catch(() => {
                // 401 → api-client already cleared localStorage.
                authService.clearAuth();
                setStatus("rejected");
            });
    }, []);

    if (status === "checking") {
        // Minimal spinner while the server check completes.
        return (
            <div className="h-dvh flex items-center justify-center bg-soft">
                <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
        );
    }

    if (status === "rejected") {
        return <Navigate to="/login" replace />;
    }

    const user = authService.getUser();
    if (role && user?.role !== role) {
        return <Navigate to={roleFallback(user?.role)} replace />;
    }

    return <>{children}</>;
}
