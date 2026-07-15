import { useState } from "react";
import { Mail, Calendar, Shield, Bell, Pencil, Save, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUserInitials } from "@/utils/user.utils";
import { apiFetch } from "@/lib/api-client";
import { authService } from "@/services/auth.service";
import { toast } from "@/hooks/use-toast";
import type { User } from "@/types/auth.types";

interface ProfilePanelProps {
  user?: User;
  onUserUpdated?: (updated: User) => void;
}

const ROLE_LABELS: Record<string, string> = {
  PATIENT: "Paciente",
  PROFESSIONAL: "Profesional",
  ADMIN: "Administrador",
};

export const ProfilePanel = ({ user, onUserUpdated }: ProfilePanelProps) => {
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [saving, setSaving] = useState(false);

  const userInitials = user ? getUserInitials(user.full_name) : "U";
  const displayName = user?.full_name || "Usuario";
  const displayEmail = user?.email || "email@empresa.com";
  const roleLabel = ROLE_LABELS[user?.role ?? ""] ?? user?.role ?? "";

  const handleSave = async () => {
    if (!fullName.trim() || fullName.trim() === user?.full_name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const updated = await apiFetch<User>("/users/me/", {
        method: "PATCH",
        body: JSON.stringify({ full_name: fullName.trim() }),
      });
      // Persist in localStorage so header/sidebar refresh immediately
      const stored = authService.getUser();
      if (stored) {
        authService.setSession({
          access: authService.getAccessToken()!,
          refresh: localStorage.getItem("auth_refresh_token") ?? "",
          user: updated,
        });
      }
      onUserUpdated?.(updated);
      setEditing(false);
      toast({ title: "Nombre actualizado correctamente." });
    } catch {
      toast({ title: "No se pudo actualizar el perfil.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFullName(user?.full_name ?? "");
    setEditing(false);
  };

  return (
    <div>
      {/* Hero banner */}
      <div className="bg-hero text-primary-foreground rounded-3xl p-8 shadow-elegant relative overflow-hidden">
        <div className="absolute top-6 right-8 text-white/10 text-6xl font-black">+</div>
        <div className="relative flex items-center gap-5">
          <div className="h-20 w-20 rounded-2xl bg-cta flex items-center justify-center font-display font-bold text-3xl shadow-glow">
            {userInitials}
          </div>
          <div>
            <h2 className="font-display font-extrabold text-2xl md:text-3xl">{displayName}</h2>
            <p className="text-white/85">{roleLabel}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs">
              <span className="bg-white/15 px-2.5 py-1 rounded-full">
                ID: ALV-{user?.id?.slice(0, 8) ?? "0000"}
              </span>
              <span className={`px-2.5 py-1 rounded-full ${user?.is_active ? "bg-success/30" : "bg-destructive/30"}`}>
                {user?.is_active ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mt-6">
        {/* Personal info card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-primary">Información personal</h3>
            {!editing && (
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
              </Button>
            )}
          </div>

          <div className="space-y-4 text-sm">
            {/* Full name — editable */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Nombre completo</p>
              {editing ? (
                <input
                  id="profile-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoFocus
                  className="w-full h-9 px-3 rounded-lg border border-border bg-soft text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              ) : (
                <p className="font-medium text-foreground">{displayName}</p>
              )}
            </div>

            {/* Email — read-only */}
            <div className="flex items-center gap-3 text-foreground">
              <Mail className="h-4 w-4 text-primary shrink-0" />
              <span>{displayEmail}</span>
            </div>

            {/* Role — read-only */}
            <div className="flex items-center gap-3 text-foreground">
              <Shield className="h-4 w-4 text-primary shrink-0" />
              <span>{roleLabel}</span>
            </div>

            {/* Member since */}
            {user?.created_at && (
              <div className="flex items-center gap-3 text-foreground">
                <Calendar className="h-4 w-4 text-primary shrink-0" />
                <span>
                  Miembro desde{" "}
                  {new Date(user.created_at).toLocaleDateString("es-CO", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Edit actions */}
          {editing && (
            <div className="flex gap-2 mt-5">
              <Button
                size="sm"
                className="flex-1"
                disabled={saving || !fullName.trim()}
                onClick={() => void handleSave()}
              >
                {saving ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-1" />
                )}
                {saving ? "Guardando…" : "Guardar"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                <X className="h-3.5 w-3.5 mr-1" /> Cancelar
              </Button>
            </div>
          )}
        </div>

        {/* Preferences card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
          <h3 className="font-display font-bold text-primary mb-4">Preferencias</h3>
          <div className="space-y-4 text-sm">
            <ToggleRow icon={Bell} label="Recordatorios de bienestar" defaultOn />
            <ToggleRow icon={Shield} label="Alta confidencialidad (cifrado E2E)" defaultOn />
            <ToggleRow icon={Mail} label="Resumen semanal por correo" />
          </div>
        </div>
      </div>

      {/* Account metadata */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft mt-5">
        <h3 className="font-display font-bold text-primary mb-4">Detalles de cuenta</h3>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">ID de usuario</div>
            <div className="font-mono text-xs text-foreground truncate">{user?.id ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Última actualización</div>
            <div className="text-foreground">
              {user?.updated_at
                ? new Date(user.updated_at).toLocaleDateString("es-CO", {
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

const ToggleRow = ({
  icon: Icon,
  label,
  defaultOn = false,
}: {
  icon: typeof Bell;
  label: string;
  defaultOn?: boolean;
}) => (
  <label className="flex items-center justify-between cursor-pointer">
    <span className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-primary" /> {label}
    </span>
    <span
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-smooth ${defaultOn ? "bg-cta" : "bg-secondary"
        }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-smooth ${defaultOn ? "translate-x-5" : "translate-x-0.5"
          }`}
      />
    </span>
  </label>
);
