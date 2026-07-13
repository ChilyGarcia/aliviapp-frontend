import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { authService } from "@/services/auth.service";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Building2,
  ArrowLeft,
  KeyRound,
} from "lucide-react";
import heroImg from "@/assets/hero-psychologist.jpg";

const Login = () => {
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    company: "",
    email: "",
    password: "",
    remember: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast({
        title: "Datos incompletos",
        description: "Ingresa tu correo y contraseña corporativos.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login({
        email: form.email,
        password: form.password,
      });

      toast({
        title: "¡Bienvenido!",
        description: `Hola ${response.user.full_name}, acceso verificado correctamente.`
      });

      navigate(response.user.role === "PROFESSIONAL" ? "/psicologo" : "/panel");
    } catch (error) {
      toast({
        title: "Error de autenticación",
        description: error instanceof Error ? error.message : "Credenciales inválidas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-soft">
      {/* LEFT - Brand panel */}
      <aside className="relative hidden lg:flex bg-hero text-primary-foreground p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 bg-pattern-x opacity-80" />
        <div className="absolute top-20 left-10 text-white/10 text-7xl font-black select-none">×</div>
        <div className="absolute bottom-20 right-12 text-white/10 text-6xl font-black select-none">+</div>

        <div className="relative">
          <Logo variant="light" />
        </div>

        <div className="relative space-y-6 max-w-md">
          <h1 className="font-display italic font-extrabold text-4xl xl:text-5xl leading-[1.05]">
            Bienvenido a tu espacio<br />de <span className="text-accent">bienestar emocional</span>.
          </h1>
          <p className="text-white/85 text-lg">
            Ingresa con tus credenciales corporativas para acceder al chat psicológico, tus check-ins y tu plan activo.
          </p>

          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5 flex items-start gap-4">
            <img src={heroImg} alt="Psicóloga" className="h-14 w-14 rounded-xl object-cover object-top" />
            <div className="text-sm">
              <div className="font-semibold">Dra. Camila Rojas</div>
              <div className="text-white/75">Está disponible para ti ahora mismo.</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-white/80">
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Cifrado extremo a extremo</div>
            <div className="flex items-center gap-2"><Lock className="h-4 w-4" /> 100% Confidencial</div>
          </div>
        </div>

        <div className="relative text-xs text-white/60">
          AliviApp ©2026 · Tu salud emocional conectada.
        </div>
      </aside>

      {/* RIGHT - Form */}
      <main className="flex flex-col justify-center p-6 sm:p-12">
        <div className="w-full max-w-md mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-smooth">
            <ArrowLeft className="h-4 w-4" /> Volver al inicio
          </Link>

          <div className="lg:hidden mb-6">
            <Logo />
          </div>

          <h2 className="font-display font-extrabold text-3xl text-primary mb-2">Iniciar sesión</h2>
          <p className="text-muted-foreground mb-8">
            Accede con tu cuenta de colaborador para iniciar tu atención psicológica por chat.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="company"
                  placeholder="Acme Corp"
                  className="pl-10 h-11"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo corporativo</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu.nombre@empresa.com"
                  className="pl-10 h-11"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <button type="button" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                  <KeyRound className="h-3 w-3" /> ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-11"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={form.remember}
                onCheckedChange={(v) => setForm({ ...form, remember: !!v })}
              />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                Mantener sesión iniciada en este equipo
              </Label>
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? "Verificando…" : <>Ingresar al panel <ArrowRight className="ml-1" /></>}
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-soft px-2 text-muted-foreground">o</span>
              </div>
            </div>

            <Button type="button" variant="outline" size="lg" className="w-full">
              <ShieldCheck className="h-4 w-4" /> Acceso con SSO empresarial
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            ¿Tu empresa aún no tiene AliviApp?{" "}
            <a href="mailto:contacto@aliviapp.com.co" className="text-primary font-semibold hover:underline">
              Solicitar activación
            </a>
          </p>

          <div className="mt-6 p-4 rounded-xl bg-secondary/60 border border-border text-xs text-muted-foreground flex items-start gap-2">
            <Lock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            Tu información se procesa de forma confidencial. Tu empleador nunca verá el contenido de tus conversaciones.
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
