import { Navigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import type { UserRole } from '@/types/auth.types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    role?: UserRole;
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
    if (!authService.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    const user = authService.getUser();
    if (role && user?.role !== role) {
        const fallback = user?.role === "PROFESSIONAL" ? "/psicologo" : "/panel";
        return <Navigate to={fallback} replace />;
    }

    return <>{children}</>;
}
