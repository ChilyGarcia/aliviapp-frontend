import { useEffect, useMemo, useState } from "react";
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
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { chatService } from "@/services/chat.service";
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
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TabKey } from "@/types/dashboard.types";

type TabConfig = { key: TabKey; label: string; icon: typeof MessageCircle; badge?: string };

const baseTabs: TabConfig[] = [
  { key: "home", label: "Inicio", icon: Home },
  { key: "chat", label: "Chat", icon: MessageCircle },
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
  const [localUser, setLocalUser] = useState(user);
  const [active, setActive] = useState<TabKey>("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("aliviapp-sidebar-collapsed") === "true"
  );
  const [chatTargetProfessionalId, setChatTargetProfessionalId] = useState<string | null>(null);
  const [chatUnread, setChatUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const refreshUnread = async () => {
      try {
        const list = await chatService.listConversations();
        if (cancelled) return;
        setChatUnread(list.reduce((sum, conversation) => sum + (conversation.unread_count || 0), 0));
      } catch {
        // silencioso
      }
    };

    void refreshUnread();
    const interval = window.setInterval(() => {
      void refreshUnread();
    }, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const tabs = useMemo(
    () =>
      baseTabs.map((tab) =>
        tab.key === "chat" && chatUnread > 0
          ? { ...tab, badge: chatUnread > 99 ? "99+" : String(chatUnread) }
          : tab
      ),
    [chatUnread]
  );

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("aliviapp-sidebar-collapsed", String(next));
      return next;
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const renderPanel = () => {
    switch (active) {
      case "home": return <HomePanel onNavigate={(k) => setActive(k)} userName={user?.full_name} />;
      case "chat": return (
        <ChatPanel
          initialProfessionalId={chatTargetProfessionalId}
          onProfessionalHandled={() => setChatTargetProfessionalId(null)}
          onUnreadChange={setChatUnread}
        />
      );
      case "checkins": return <CheckInsPanel />;
      case "triage": return <TriagePanel />;
      case "library": return <LibraryPanel />;
      case "alerts": return (
        <AlertsPanel
          onOpenChat={(professionalId) => {
            setChatTargetProfessionalId(professionalId);
            setActive("chat");
          }}
        />
      );
      case "specialists": return (
        <SpecialistsPanel
          onNavigate={setActive}
          onStartChat={setChatTargetProfessionalId}
        />
      );
      case "plan": return <PlanPanel />;
      case "profile": return <ProfilePanel user={localUser || undefined} onUserUpdated={(u) => setLocalUser(u)} />;
    }
  };

  return (
    <div className="h-dvh overflow-hidden bg-soft flex">
      {/* SIDEBAR */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 h-dvh bg-sidebar text-sidebar-foreground flex flex-col overflow-hidden shrink-0 transition-all duration-300",
          mobileOpen ? "translate-x-0 w-72" : "-translate-x-full w-72",
          "lg:translate-x-0",
          sidebarCollapsed
            ? "lg:w-0 lg:opacity-0 lg:pointer-events-none lg:border-0"
            : "lg:w-72 lg:opacity-100"
        )}
      >
        <div
          className="p-6 border-b border-sidebar-border flex items-center justify-between shrink-0"
          onWheel={(e) => e.stopPropagation()}
        >
          <Logo variant="light" />
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 rounded-lg hover:bg-sidebar-accent transition-smooth">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className="px-4 py-3 mx-4 mt-4 rounded-2xl bg-sidebar-accent flex items-center gap-3 shrink-0"
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="h-10 w-10 rounded-full bg-cta flex items-center justify-center font-bold text-sm">
            {user ? getUserInitials(user.full_name) : "U"}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">{user?.full_name || "Usuario"}</div>
            <div className="text-xs text-sidebar-foreground/70 truncate">{user?.email || "email@empresa.com"}</div>
          </div>
        </div>

        <nav
          data-sidebar-nav
          className="flex-1 min-h-0 p-4 space-y-1 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent]"
        >
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

        <div
          className="p-4 border-t border-sidebar-border space-y-2 shrink-0 bg-sidebar"
          onWheel={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-sidebar-foreground bg-sidebar-accent/50 border border-sidebar-border hover:bg-destructive/20 hover:border-destructive/40 hover:text-red-100 transition-smooth group"
          >
            <LogOut className="h-5 w-5 text-sidebar-foreground/70 group-hover:text-red-200" />
            <span>Cerrar sesión</span>
          </button>
          <Link
            to="/"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-smooth"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <header className="h-16 bg-card border-b border-border shrink-0 px-4 lg:px-8">
          <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex"
                onClick={toggleSidebar}
                title={sidebarCollapsed ? "Mostrar menú" : "Ocultar menú"}
              >
                {sidebarCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
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
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 lg:p-8">
          <DashboardContent
            fullWidth={active === "chat"}
            narrow={active === "plan" || active === "profile"}
          >
            {renderPanel()}
          </DashboardContent>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
