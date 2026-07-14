import { Mail, Phone, Building2, Calendar, Shield, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUserInitials } from "@/utils/user.utils";
import type { User } from "@/types/auth.types";

interface ProfilePanelProps {
  user?: User;
}

export const ProfilePanel = ({ user }: ProfilePanelProps) => {
  const userName = user?.full_name || "Usuario";
  const userEmail = user?.email || "email@empresa.com";
  const userInitials = user ? getUserInitials(user.full_name) : "U";
  return (
    <div>
      <div className="bg-hero text-primary-foreground rounded-3xl p-8 shadow-elegant relative overflow-hidden">
        <div className="absolute top-6 right-8 text-white/10 text-6xl font-black">+</div>
        <div className="relative flex items-center gap-5">
          <div className="h-20 w-20 rounded-2xl bg-cta flex items-center justify-center font-display font-bold text-3xl shadow-glow">{userInitials}</div>
          <div>
            <h2 className="font-display font-extrabold text-2xl md:text-3xl">{userName}</h2>
            <p className="text-white/85">Colaborador · Plan Wellness Empresa</p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs">
              <span className="bg-white/15 px-2.5 py-1 rounded-full">ID: ALV-{user?.id || "0000"}</span>
              <span className="bg-success/30 px-2.5 py-1 rounded-full">Activo</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mt-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
          <h3 className="font-display font-bold text-primary mb-4">Información personal</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-primary" /> {userEmail}</div>
            <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-primary" /> +57 310 555 4823</div>
            <div className="flex items-center gap-3"><Building2 className="h-4 w-4 text-primary" /> Acme Corp · Tecnología</div>
            <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-primary" /> Miembro desde mar 2024</div>
          </div>
          <Button variant="outline" size="sm" className="mt-5 w-full">Editar información</Button>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
          <h3 className="font-display font-bold text-primary mb-4">Preferencias</h3>
          <div className="space-y-4 text-sm">
            <ToggleRow icon={Bell} label="Recordatorios de bienestar" defaultOn />
            <ToggleRow icon={Shield} label="Alta confidencialidad (cifrado E2E)" defaultOn />
            <ToggleRow icon={Mail} label="Resumen semanal por correo" />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft mt-5">
        <h3 className="font-display font-bold text-primary mb-4">Tu progreso emocional</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { v: "12", l: "Sesiones" },
            { v: "7", l: "Días seguidos" },
            { v: "85%", l: "Bienestar" },
          ].map((m) => (
            <div key={m.l} className="bg-soft rounded-2xl p-4">
              <div className="font-display font-extrabold text-3xl text-primary">{m.v}</div>
              <div className="text-xs text-muted-foreground mt-1">{m.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ToggleRow = ({ icon: Icon, label, defaultOn = false }: { icon: typeof Bell; label: string; defaultOn?: boolean }) => {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="flex items-center gap-3"><Icon className="h-4 w-4 text-primary" /> {label}</span>
      <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-smooth ${defaultOn ? "bg-cta" : "bg-secondary"}`}>
        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-smooth ${defaultOn ? "translate-x-5" : "translate-x-0.5"}`} />
      </span>
    </label>
  );
};
