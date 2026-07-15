import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getUserInitials } from "@/utils/user.utils";
import { adminService } from "@/services/admin.service";
import { toast } from "@/hooks/use-toast";
import type { AdminStats } from "@/types/admin.types";
import type { User } from "@/types/auth.types";
import {
    LayoutDashboard,
    Users,
    LogOut,
    RefreshCw,
    AlertCircle,
    UserCheck,
    UserX,
    Calendar,
    CalendarCheck,
    CalendarX,
    Heart,
    TrendingUp,
    Search,
    Shield,
    ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TabKey = "dashboard" | "users";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [active, setActive] = useState<TabKey>("dashboard");
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const tabs = [
        { key: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
        { key: "users" as const, label: "Usuarios", icon: Users },
    ];

    return (
        <div className="h-dvh overflow-hidden bg-soft flex">
            {/* SIDEBAR */}
            <aside
                className={cn(
                    "fixed lg:static inset-y-0 left-0 z-40 h-dvh w-72 bg-sidebar text-sidebar-foreground flex flex-col overflow-hidden shrink-0 transition-all duration-300",
                    mobileOpen ? "translate-x-0" : "-translate-x-full",
                    "lg:translate-x-0"
                )}
            >
                <div className="p-6 border-b border-sidebar-border flex items-center gap-3 shrink-0">
                    <Logo variant="light" />
                    <span className="text-xs font-bold bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                        ADMIN
                    </span>
                </div>

                <div className="px-4 py-3 mx-4 mt-4 rounded-2xl bg-sidebar-accent flex items-center gap-3 shrink-0">
                    <div className="h-10 w-10 rounded-full bg-cta flex items-center justify-center font-bold text-sm text-primary-foreground">
                        {user ? getUserInitials(user.full_name) : "A"}
                    </div>
                    <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">{user?.full_name || "Admin"}</div>
                        <div className="text-xs text-sidebar-foreground/70 flex items-center gap-1">
                            <Shield className="h-3 w-3" /> Administrador
                        </div>
                    </div>
                </div>

                <nav className="flex-1 min-h-0 p-4 space-y-1 overflow-y-auto">
                    {tabs.map((tab) => {
                        const isActive = active === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => { setActive(tab.key); setMobileOpen(false); }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-smooth",
                                    isActive
                                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
                                        : "text-sidebar-foreground/85 hover:bg-sidebar-accent"
                                )}
                            >
                                <tab.icon className="h-5 w-5" />
                                <span className="flex-1 text-left">{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-sidebar-border shrink-0">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-sidebar-foreground bg-sidebar-accent/50 border border-sidebar-border hover:bg-destructive/20 hover:border-destructive/40 hover:text-red-100 transition-smooth group"
                    >
                        <LogOut className="h-5 w-5 text-sidebar-foreground/70 group-hover:text-red-200" />
                        <span>Cerrar sesión</span>
                    </button>
                </div>
            </aside>

            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* MAIN */}
            <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
                <header className="h-16 bg-card border-b border-border shrink-0 px-4 lg:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setMobileOpen(true)}
                        >
                            <ChevronDown className="h-5 w-5 rotate-[-90deg]" />
                        </Button>
                        <div>
                            <h1 className="font-display font-bold text-lg text-primary">
                                {tabs.find((t) => t.key === active)?.label}
                            </h1>
                            <p className="text-xs text-muted-foreground hidden sm:block">
                                Panel de administración · AliviApp
                            </p>
                        </div>
                    </div>
                </header>

                <div className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-8">
                    <div className="mx-auto max-w-7xl w-full animate-fade-in">
                        {active === "dashboard" && <DashboardTab />}
                        {active === "users" && <UsersTab />}
                    </div>
                </div>
            </main>
        </div>
    );
};

/* ─── Dashboard Tab ─────────────────────────────────────────────────────── */

const DashboardTab = () => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = async () => {
        setLoading(true);
        setError(false);
        try {
            const data = await adminService.getStats();
            setStats(data);
        } catch {
            setError(true);
            toast({ title: "No se pudieron cargar las estadísticas", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void load(); }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-card border border-border rounded-2xl p-5 h-28 animate-pulse" />
                ))}
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="bg-card border border-border rounded-3xl p-8 text-center space-y-4 shadow-soft">
                <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
                <p className="text-sm text-muted-foreground">No se pudieron cargar las estadísticas.</p>
                <Button variant="outline" onClick={() => void load()}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
                </Button>
            </div>
        );
    }

    const userCards = [
        {
            label: "Total usuarios",
            value: stats.users.total,
            icon: Users,
            color: "text-primary",
            bg: "bg-primary/10",
        },
        {
            label: "Pacientes",
            value: stats.users.patients,
            icon: UserCheck,
            color: "text-success",
            bg: "bg-success/10",
        },
        {
            label: "Profesionales",
            value: stats.users.professionals,
            icon: TrendingUp,
            color: "text-accent",
            bg: "bg-accent/10",
        },
        {
            label: "Check-ins totales",
            value: stats.checkins.total,
            icon: Heart,
            color: "text-rose-500",
            bg: "bg-rose-50",
        },
    ];

    const appointmentCards = [
        {
            label: "Total citas",
            value: stats.appointments.total,
            icon: Calendar,
            color: "text-primary",
            bg: "bg-primary/10",
        },
        {
            label: "Programadas",
            value: stats.appointments.scheduled,
            icon: CalendarCheck,
            color: "text-warning",
            bg: "bg-warning/10",
        },
        {
            label: "Completadas",
            value: stats.appointments.completed,
            icon: CalendarCheck,
            color: "text-success",
            bg: "bg-success/10",
        },
        {
            label: "Canceladas",
            value: stats.appointments.cancelled,
            icon: CalendarX,
            color: "text-destructive",
            bg: "bg-destructive/10",
        },
    ];

    return (
        <div className="space-y-8">
            {/* Hero banner */}
            <div className="bg-hero text-primary-foreground rounded-3xl p-6 lg:p-8 shadow-elegant relative overflow-hidden">
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="relative">
                    <div className="flex items-center gap-2 text-sm bg-white/15 w-fit px-3 py-1.5 rounded-full mb-3">
                        <Shield className="h-4 w-4 text-accent" /> Panel de administración
                    </div>
                    <h2 className="font-display font-extrabold text-2xl lg:text-3xl">
                        Resumen general de AliviApp
                    </h2>
                    <p className="text-white/80 mt-2 text-sm">
                        Métricas en tiempo real de usuarios, citas y check-ins de la plataforma.
                    </p>
                </div>
            </div>

            {/* Usuarios */}
            <div>
                <h3 className="font-display font-bold text-primary text-lg mb-4">Usuarios</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 xl:gap-4">
                    {userCards.map((c) => (
                        <StatCard key={c.label} {...c} />
                    ))}
                </div>
            </div>

            {/* Citas */}
            <div>
                <h3 className="font-display font-bold text-primary text-lg mb-4">Citas</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 xl:gap-4">
                    {appointmentCards.map((c) => (
                        <StatCard key={c.label} {...c} />
                    ))}
                </div>
            </div>
        </div>
    );
};

/* ─── Stat Card ─────────────────────────────────────────────────────────── */

interface StatCardProps {
    label: string;
    value: number;
    icon: React.ElementType;
    color: string;
    bg: string;
}

const StatCard = ({ label, value, icon: Icon, color, bg }: StatCardProps) => (
    <div className="bg-card border border-border rounded-2xl p-4 xl:p-5 shadow-soft hover:shadow-elegant transition-smooth">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-3", bg, color)}>
            <Icon className="h-5 w-5" />
        </div>
        <div className="font-display font-extrabold text-2xl text-primary">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
);

/* ─── Users Tab ─────────────────────────────────────────────────────────── */

const ROLE_LABELS: Record<string, string> = {
    PATIENT: "Paciente",
    PROFESSIONAL: "Profesional",
    ADMIN: "Admin",
};

const ROLE_COLORS: Record<string, string> = {
    PATIENT: "bg-success/15 text-success",
    PROFESSIONAL: "bg-primary/10 text-primary",
    ADMIN: "bg-accent/15 text-accent",
};

const UsersTab = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [deactivating, setDeactivating] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        setError(false);
        try {
            const data = await adminService.getUsers();
            setUsers(data);
        } catch {
            setError(true);
            toast({ title: "No se pudieron cargar los usuarios", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void load(); }, []);

    const handleDeactivate = async (userId: string, userName: string) => {
        if (!confirm(`¿Desactivar al usuario "${userName}"?`)) return;
        setDeactivating(userId);
        try {
            await adminService.deactivateUser(userId);
            setUsers((prev) =>
                prev.map((u) => (u.id === userId ? { ...u, is_active: false } : u))
            );
            toast({ title: `Usuario "${userName}" desactivado correctamente.` });
        } catch {
            toast({ title: "No se pudo desactivar el usuario", variant: "destructive" });
        } finally {
            setDeactivating(null);
        }
    };

    const filtered = users.filter((u) => {
        const matchSearch =
            !search ||
            u.full_name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        const matchRole = !roleFilter || u.role === roleFilter;
        return matchSearch && matchRole;
    });

    if (loading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-card border border-border rounded-2xl h-16 animate-pulse" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-card border border-border rounded-3xl p-8 text-center space-y-4 shadow-soft">
                <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
                <p className="text-sm text-muted-foreground">No se pudieron cargar los usuarios.</p>
                <Button variant="outline" onClick={() => void load()}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o email…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 h-10 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="h-10 px-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                    <option value="">Todos los roles</option>
                    <option value="PATIENT">Pacientes</option>
                    <option value="PROFESSIONAL">Profesionales</option>
                    <option value="ADMIN">Admins</option>
                </select>
                <Button variant="outline" size="sm" onClick={() => void load()} className="h-10 px-4">
                    <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
                </Button>
            </div>

            {/* Count */}
            <p className="text-sm text-muted-foreground">
                {filtered.length} usuario{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
            </p>

            {/* Table */}
            <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                        No hay usuarios que coincidan con los filtros.
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {filtered.map((u) => (
                            <div
                                key={u.id}
                                className="flex items-center gap-4 px-5 py-4 hover:bg-soft transition-smooth"
                            >
                                <div className="h-10 w-10 rounded-full bg-cta flex items-center justify-center font-bold text-sm text-primary-foreground shrink-0">
                                    {getUserInitialsFromName(u.full_name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm text-foreground truncate">{u.full_name}</div>
                                    <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                                </div>
                                <div className="hidden sm:flex items-center gap-2 shrink-0">
                                    <span
                                        className={cn(
                                            "text-xs font-semibold px-2.5 py-0.5 rounded-full",
                                            ROLE_COLORS[u.role] ?? "bg-secondary text-muted-foreground"
                                        )}
                                    >
                                        {ROLE_LABELS[u.role] ?? u.role}
                                    </span>
                                    <span
                                        className={cn(
                                            "text-xs font-semibold px-2.5 py-0.5 rounded-full",
                                            u.is_active
                                                ? "bg-success/15 text-success"
                                                : "bg-destructive/15 text-destructive"
                                        )}
                                    >
                                        {u.is_active ? "Activo" : "Inactivo"}
                                    </span>
                                </div>
                                {u.is_active && u.role !== "ADMIN" && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                                        disabled={deactivating === u.id}
                                        onClick={() => void handleDeactivate(u.id, u.full_name)}
                                    >
                                        {deactivating === u.id ? (
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <UserX className="h-4 w-4" />
                                        )}
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

function getUserInitialsFromName(name: string): string {
    return name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

export default AdminDashboard;
