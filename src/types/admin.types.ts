export interface AdminStats {
    users: {
        total: number;
        patients: number;
        professionals: number;
    };
    appointments: {
        total: number;
        scheduled: number;
        completed: number;
        cancelled: number;
    };
    checkins: {
        total: number;
    };
}
