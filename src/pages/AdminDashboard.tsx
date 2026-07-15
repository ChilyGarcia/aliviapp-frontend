import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getUserInitials } from "@/utils/user.utils";
import { adminService } from "@/services/admin.service";
import { apiFetch } from "@/lib/api-client";
import { authService } from "@/services/auth.service";
import { toast } from "@/hooks/use-toast";
import type { AdminStats, PatientPlanSummary, PlanSummaryResponse } from "@/types/admin.types";
import type { User } from "@/types/auth.types";
import {
    LayoutDashboard,
    Users,
    CreditCard,
    User as UserIcon,
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
    CheckCircle2,
    XCircle,
    BarChart3,
    Mail,
    Pencil,
    Save,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TabKey = "dashboard" | "users" | "plans" | "profile";

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
        { key: "plans" as const, label: "Planes", icon: CreditCard },
        { key: "profile" as const, label: "Mi perfil", icon: UserIcon },
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
                        {active === "plans" && <PlansTab />}
                        {active === "profile" && <ProfileTab />}
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
    const [toggling, setToggling] = useState<string | null>(null);

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

    const handleToggleActive = async (u: User) => {
        const nextState = !u.is_active;
        const action = nextState ? "activar" : "desactivar";
        if (!confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} al usuario "${u.full_name}"?`)) return;

        setToggling(u.id);
        try {
            const updated = await adminService.setUserActive(u.id, nextState);
            setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
            toast({ title: `Usuario "${u.full_name}" ${nextState ? "activado" : "desactivado"} correctamente.` });
        } catch {
            toast({ title: `No se pudo ${action} el usuario`, variant: "destructive" });
        } finally {
            setToggling(null);
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
                                {u.role !== "ADMIN" && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        title={u.is_active ? "Desactivar usuario" : "Activar usuario"}
                                        className={cn(
                                            "shrink-0",
                                            u.is_active
                                                ? "text-destructive hover:text-destructive hover:bg-destructive/10"
                                                : "text-success hover:text-success hover:bg-success/10"
                                        )}
                                        disabled={toggling === u.id}
                                        onClick={() => void handleToggleActive(u)}
                                    >
                                        {toggling === u.id ? (
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                        ) : (
                                            u.is_active
                                                ? <UserX className="h-4 w-4" />
                                                : <UserCheck className="h-4 w-4" />
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

/* ─── Plans Tab ─────────────────────────────────────────────────────────── */

const PlansTab = () => {
    const [data, setData] = useState<PlanSummaryResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState("");
    const [view, setView] = useState<"all" | "paid" | "free">("all");

    const load = async () => {
        setLoading(true);
        setError(false);
        try {
            setData(await adminService.getPlanSummary());
        } catch {
            setError(true);
            toast({ title: "No se pudo cargar el resumen de planes", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void load(); }, []);

    if (loading) {
        return (
            <div className="space-y-3">
                {["a", "b", "c", "d", "e"].map((k) => (
                    <div key={k} className="bg-card border border-border rounded-2xl h-20 animate-pulse" />
                ))}
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-card border border-border rounded-3xl p-8 text-center space-y-4 shadow-soft">
                <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
                <p className="text-sm text-muted-foreground">No se pudo cargar el resumen de planes.</p>
                <Button variant="outline" onClick={() => void load()}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
                </Button>
            </div>
        );
    }

    const allUsers = [...data.paid, ...data.free];
    const sourceList = view === "paid" ? data.paid : view === "free" ? data.free : allUsers;
    const filtered = sourceList.filter(
        (u) =>
            !search ||
            u.full_name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
                    <div className="h-10 w-10 rounded-xl bg-success/10 text-success flex items-center justify-center mb-3">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="font-display font-extrabold text-2xl text-primary">{data.totals.paid_count}</div>
                    <div className="text-xs text-muted-foreground mt-1">Pacientes con plan de pago</div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
                    <div className="h-10 w-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center mb-3">
                        <XCircle className="h-5 w-5" />
                    </div>
                    <div className="font-display font-extrabold text-2xl text-primary">{data.totals.free_count}</div>
                    <div className="text-xs text-muted-foreground mt-1">Pacientes sin renovar (FREE)</div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                        <BarChart3 className="h-5 w-5" />
                    </div>
                    <div className="font-display font-extrabold text-2xl text-primary">
                        {data.totals.paid_count + data.totals.free_count}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Total pacientes activos</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar paciente…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 h-10 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>
                <div className="flex rounded-xl border border-border overflow-hidden h-10 shrink-0">
                    {(["all", "paid", "free"] as const).map((v) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={cn(
                                "px-4 text-sm font-medium transition-smooth",
                                view === v
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-card text-muted-foreground hover:bg-soft"
                            )}
                        >
                            {v === "all" ? "Todos" : v === "paid" ? "Con plan" : "Sin renovar"}
                        </button>
                    ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => void load()} className="h-10 px-4">
                    <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
                </Button>
            </div>

            <p className="text-sm text-muted-foreground">
                {filtered.length} paciente{filtered.length !== 1 ? "s" : ""}
            </p>

            {/* Table */}
            <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                        No hay pacientes que coincidan.
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {filtered.map((u) => <PlanRow key={u.user_id} patient={u} />)}
                    </div>
                )}
            </div>
        </div>
    );
};

const PlanRow = ({ patient: u }: { patient: PatientPlanSummary }) => {
    const pct = u.monthly_limit > 0
        ? Math.min((u.consumed_this_month / u.monthly_limit) * 100, 100)
        : 0;

    return (
        <div className="px-5 py-4 hover:bg-soft transition-smooth">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-cta flex items-center justify-center font-bold text-sm text-primary-foreground shrink-0">
                    {u.full_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground truncate">{u.full_name}</span>
                        <span
                            className={cn(
                                "text-xs font-semibold px-2 py-0.5 rounded-full shrink-0",
                                u.is_free_plan
                                    ? "bg-warning/15 text-warning"
                                    : "bg-success/15 text-success"
                            )}
                        >
                            {u.plan_name}
                        </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                </div>
                <div className="hidden md:flex items-center gap-6 shrink-0 text-right">
                    <div>
                        <div className="text-xs text-muted-foreground">Sesiones</div>
                        <div className="text-sm font-semibold text-foreground">
                            {u.consumed_this_month} / {u.monthly_limit}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground">Restantes</div>
                        <div className={cn(
                            "text-sm font-semibold",
                            u.remaining_this_month === 0
                                ? "text-destructive"
                                : u.remaining_this_month <= 3
                                    ? "text-warning"
                                    : "text-success"
                        )}>
                            {u.remaining_this_month}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground">Duración</div>
                        <div className="text-sm font-semibold text-foreground">{u.duration_minutes} min</div>
                    </div>
                </div>
            </div>
            {/* Consumption bar */}
            <div className="mt-3 ml-14">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Consumo del mes</span>
                    <span>{Math.round(pct)}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                        className={cn(
                            "h-full rounded-full transition-all",
                            pct >= 100
                                ? "bg-destructive"
                                : pct >= 75
                                    ? "bg-warning"
                                    : "bg-success"
                        )}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>
        </div>
    );
};


/* ─── Profile Tab ───────────────────────────────────────────────────────── */

const ProfileTab = () => {
    const { user } = useAuth();
    const [editing, setEditing] = useState(false);
    const [fullName, setFullName] = useState(user?.full_name ?? "");
    const [saving, setSaving] = useState(false);
    const [localUser, setLocalUser] = useState<User | null>(user);

    const handleSave = async () => {
        if (!fullName.trim()) return;
        setSaving(true);
        try {
            const updated = await apiFetch<User>("/users/me/", {
                method: "PATCH",
                body: JSON.stringify({ full_name: fullName.trim() }),
            });
            // Persist updated user in localStorage so header and sidebar reflect the change
            const stored = authService.getUser();
            if (stored) {
                authService.setSession({
                    access: authService.getAccessToken()!,
                    refresh: localStorage.getItem("auth_refresh_token") ?? "",
                    user: updated,
                });
            }
            setLocalUser(updated);
            setEditing(false);
            toast({ title: "Perfil actualizado correctamente." });
        } catch {
            toast({ title: "No se pudo actualizar el perfil.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFullName(localUser?.full_name ?? "");
        setEditing(false);
    };

    const displayUser = localUser ?? user;
    const initials = displayUser
        ? displayUser.full_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
        : "A";

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Hero banner */}
            <div className="bg-hero text-primary-foreground rounded-3xl p-8 shadow-elegant relative overflow-hidden">
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="relative flex items-center gap-5">
                    <div className="h-20 w-20 rounded-2xl bg-cta flex items-center justify-center font-display font-bold text-3xl shadow-soft text-primary-foreground">
                        {initials}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-sm bg-white/15 w-fit px-3 py-1 rounded-full mb-2">
                            <Shield className="h-3.5 w-3.5 text-accent" /> Administrador
                        </div>
                        <h2 className="font-display font-extrabold text-2xl">{displayUser?.full_name}</h2>
                        <p className="text-white/75 text-sm">{displayUser?.email}</p>
                    </div>
                </div>
            </div>

            {/* Personal data card */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-display font-bold text-primary">Información personal</h3>
                    {!editing && (
                        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                            <Pencil className="h-4 w-4 mr-2" /> Editar
                        </Button>
                    )}
                </div>

                <div className="space-y-4">
                    {/* Full name field */}
                    <div>
                        <label htmlFor="admin-fullname" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                            Nombre completo
                        </label>
                        {editing ? (
                            <input
                                id="admin-fullname"
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-border bg-soft text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                autoFocus
                            />
                        ) : (
                            <p className="text-sm text-foreground font-medium">{displayUser?.full_name}</p>
                        )}
                    </div>

                    {/* Email — read-only */}
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                            Correo electrónico
                        </p>
                        <div className="flex items-center gap-2 text-sm text-foreground">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {displayUser?.email}
                            <span className="text-xs text-muted-foreground">(no editable)</span>
                        </div>
                    </div>

                    {/* Role — read-only */}
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                            Rol
                        </p>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-accent/15 text-accent">
                            <Shield className="h-3.5 w-3.5" /> Administrador
                        </span>
                    </div>

                    {/* Account status */}
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                            Estado de cuenta
                        </p>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-success/15 text-success">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Activo
                        </span>
                    </div>
                </div>

                {editing && (
                    <div className="flex gap-3 mt-6 pt-5 border-t border-border">
                        <Button
                            onClick={() => void handleSave()}
                            disabled={saving || !fullName.trim() || fullName.trim() === displayUser?.full_name}
                            className="flex-1"
                        >
                            {saving ? (
                                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            {saving ? "Guardando…" : "Guardar cambios"}
                        </Button>
                        <Button variant="outline" onClick={handleCancel} disabled={saving}>
                            <X className="h-4 w-4 mr-2" /> Cancelar
                        </Button>
                    </div>
                )}
            </div>

            {/* Account metadata */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
                <h3 className="font-display font-bold text-primary mb-4">Detalles de cuenta</h3>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                        <div className="text-xs text-muted-foreground mb-0.5">ID de usuario</div>
                        <div className="font-mono text-xs text-foreground truncate">{displayUser?.id}</div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground mb-0.5">Miembro desde</div>
                        <div className="text-foreground">
                            {displayUser?.created_at
                                ? new Date(displayUser.created_at).toLocaleDateString("es-CO", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })
                                : "—"}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground mb-0.5">Última actualización</div>
                        <div className="text-foreground">
                            {displayUser?.updated_at
                                ? new Date(displayUser.updated_at).toLocaleDateString("es-CO", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })
                                : "—"}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
