import { useMemo } from 'react';

export function useGreeting() {
    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return "Buenos días";
        if (hour < 19) return "Buenas tardes";
        return "Buenas noches";
    }, []);

    return greeting;
}
