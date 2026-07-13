import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getUserInitials } from "@/utils/user.utils";
import { HomePanel } from "@/components/dashboard/HomePanel";
import { ChatPanel } from "@/components/dashboard/ChatPanel";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { SpecialistsPanel } from "@/components/dashboard/SpecialistsPanel";
import { PlanPanel } from "@/components/dashboard/PlanPanel";
import { ProfilePanel } from "@/components/dashboard/ProfilePanel";
import { TriagePanel } from "@/components/dashboard/TriagePanel";
import { CheckInsPanel } from "@/components/dashboard/CheckInsPanel";
import { LibraryPanel } from "@/components/dashboard/LibraryPanel";
import {
  MessageCircle,
  Bell,
  Users,
  CreditCard,
  User,
  Brain,
  ArrowLeft,
  Menu,
  X,
  Home,
  Heart,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TabKey } from "@/types/dashboard.types";

type TabConfig = { key: TabKey; label: string; icon: typeof MessageCircle; badge?: string };

const tabs: TabConfig[] = [
  { key: "home", label: "Inicio", icon: Home },
  { key: "chat", label: "Chat", icon: MessageCircle, badge: "2" },
  { key: "checkins", label: "Check-ins", icon: Heart },
  { key: "triage", label: "Triage IA", icon: Brain },
  { key: "library", label: "Biblioteca", icon: BookOpen },
  { key: "alerts", label: "Alertas", icon: Bell, badge: "3" },
  { key: "specialists", label: "Profesionales", icon: Users },
  { key: "plan", label: "Mi Plan", icon: CreditCard },
  { key: "profile", label: "Perfil", icon: User },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [active, setActive] = useState<TabKey>("home");
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const renderPanel = () => {
    switch (active) {
      case "home": return <HomePanel onNavigate={(k) => setActive(k)} userName={user?.full_name} />;
      case "chat": return <ChatPanel />;
      case "checkins": return <CheckInsPanel />;
      case "triage": return <TriagePanel />;
      case "library": return <LibraryPanel />;
      case "alerts": return <AlertsPanel />;
      case "specialists": return <SpecialistsPanel />;
      case "plan": return <PlanPanel />;
      case "profile": return <ProfilePanel user={user || undefined} />;
    }
  };

  return (
    <div className="min-h-screen bg-soft flex">
      {/* SIDEBAR */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-72 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
          <Logo variant="light" />
          <button onClick={() => setMobileOpen(false)} className="lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-3 mx-4 mt-4 rounded-2xl bg-sidebar-accent flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-cta flex items-center justify-center font-bold text-sm">
            {user ? getUserInitials(user.full_name) : "U"}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">{user?.full_name || "Usuario"}</div>
            <div className="text-xs text-sidebar-foreground/70 truncate">{user?.email || "email@empresa.com"}</div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
                {tab.badge && (
                  <span className={cn(
                    "h-5 min-w-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center",
                    isActive ? "bg-sidebar-primary-foreground/20" : "bg-accent text-accent-foreground"
                  )}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-smooth"
          >
            <ArrowLeft className="h-4 w-4" /> Cerrar sesión
          </button>
          <Link to="/" className="flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-smooth">
            <ArrowLeft className="h-4 w-4" /> Volver al inicio
          </Link>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-display font-bold text-lg text-primary capitalize">
                {tabs.find((t) => t.key === active)?.label}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Bienvenido, {user?.full_name.split(" ")[0] || "Usuario"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setActive("triage")}>
              <Brain className="h-4 w-4" /> Iniciar Triage
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="animate-fade-in">{renderPanel()}</div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
