import { Navigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import type { UserRole } from '@/types/auth.types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    role?: UserRole;
}

function roleFallback(role: UserRole | undefined): string {
    if (role === "PROFESSIONAL") return "/psicologo";
    if (role === "ADMIN") return "/admin";
    return "/panel";
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
    if (!authService.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    const user = authService.getUser();
    if (role && user?.role !== role) {
        return <Navigate to={roleFallback(user?.role)} replace />;
    }

    return <>{children}</>;
}
