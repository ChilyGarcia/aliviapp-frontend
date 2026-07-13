import { useState } from 'react';
import { authService } from '@/services/auth.service';
import type { User } from '@/types/auth.types';

export function useAuth() {
    const [user, setUser] = useState<User | null>(authService.getUser());
    const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());

    const logout = () => {
        authService.logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    return {
        user,
        isAuthenticated,
        loading: false,
        logout,
    };
}
