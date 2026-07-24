import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  ShieldCheck,
  Brain,
  Clock,
  HeartPulse,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Building2,
  Lock,
  Facebook,
  Instagram,
  Youtube,
} from "lucide-react";
import heroImg from "@/assets/hero-psychologist.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="absolute top-0 left-0 right-0 z-20">
        <div className="container flex items-center justify-between py-5">
          <Logo variant="light" />
          <nav className="hidden md:flex items-center gap-8 text-sm text-white/80">
            <a href="#servicio" className="hover:text-white transition-smooth">Servicio</a>
            <a href="#beneficios" className="hover:text-white transition-smooth">Beneficios</a>
            <a href="#empresas" className="hover:text-white transition-smooth">Empresas</a>
            <a href="#contacto" className="hover:text-white transition-smooth">Contacto</a>
          </nav>
          <Button asChild variant="soft" size="sm">
            <Link to="/login">Ingresar</Link>
          </Button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative bg-hero text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-pattern-x opacity-80" />
        {/* deco crosses */}
        <div className="absolute top-24 left-10 text-white/10 text-7xl font-black select-none">×</div>
        <div className="absolute bottom-20 left-20 text-white/15 text-5xl font-black select-none">×</div>
        <div className="absolute top-1/3 right-10 text-white/10 text-6xl font-black select-none">+</div>

        <div className="container relative pt-32 pb-24 md:pt-40 md:pb-32 grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-medium mb-6">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse-soft" />
              Disponible 24/7 para colaboradores
            </div>

            <h1 className="font-display italic font-extrabold text-5xl md:text-6xl lg:text-7xl leading-[0.95] mb-6">
              Atención<br />
              Psicológica<br />
              <span className="text-accent">por Chat</span>
            </h1>

            <p className="text-lg md:text-xl text-white/85 max-w-xl mb-8 leading-relaxed">
              Servicio de acompañamiento psicológico vía chat, donde los{" "}
              <strong className="text-white">colaboradores</strong> pueden escribir en cualquier momento para recibir{" "}
              <strong className="text-white">orientación profesional</strong>, primeros auxilios emocionales, guía en situaciones de estrés y recomendaciones basadas en buenas prácticas de{" "}
              <strong className="text-white">salud mental</strong>.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button asChild variant="hero" size="xl">
                <Link to="/login">
                  Ingresar al chat
                  <ArrowRight className="ml-1" />
                </Link>
              </Button>
              <Button asChild variant="soft" size="xl">
                <a href="#servicio">Conocer más</a>
              </Button>
            </div>

            <div className="mt-10 flex items-center gap-6 text-sm text-white/75">
              <div className="flex items-center gap-2"><Lock className="h-4 w-4" /> Confidencial</div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> Respuesta inmediata</div>
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Profesionales certificados</div>
            </div>
          </div>

          {/* Hero card */}
          <div className="relative animate-fade-in">
            <div className="absolute -inset-4 bg-accent/30 blur-3xl rounded-full" />
            <div className="relative bg-white text-foreground rounded-3xl p-6 shadow-elegant max-w-md ml-auto">
              <div className="flex items-start gap-4">
                <img
                  src={heroImg}
                  alt="Psicóloga profesional sonriendo"
                  width={120}
                  height={120}
                  className="h-24 w-24 rounded-2xl object-cover object-top"
                />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">En línea ahora</div>
                  <div className="font-display font-bold text-lg text-primary">Dra. Camila Rojas</div>
                  <div className="text-xs text-muted-foreground">Psicóloga clínica · 8 años exp.</div>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    <span className="text-success font-medium">Disponible</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <div className="bg-secondary text-sm rounded-2xl rounded-tl-sm p-3 max-w-[85%]">
                  Hola 👋 Soy Camila. Cuéntame qué te tiene preocupado hoy, este es un espacio seguro.
                </div>
                <div className="bg-cta text-primary-foreground text-sm rounded-2xl rounded-tr-sm p-3 max-w-[85%] ml-auto">
                  He sentido mucha ansiedad esta semana en el trabajo…
                </div>
              </div>

              <Button asChild variant="hero" size="default" className="w-full mt-5">
                <Link to="/login">Iniciar mi conversación</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* wave */}
        <svg className="absolute bottom-0 left-0 w-full h-12 text-background" viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,40 C360,90 1080,-10 1440,40 L1440,80 L0,80 Z" />
        </svg>
      </section>

      {/* SERVICIO */}
      <section id="servicio" className="py-24">
        <div className="container">
          <div className="max-w-2xl mb-14">
            <span className="text-accent font-semibold text-sm uppercase tracking-wider">El servicio</span>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl mt-3 mb-4 text-primary">
              Cuidamos tu bienestar emocional, en cualquier momento.
            </h2>
            <p className="text-muted-foreground text-lg">
              Una conversación segura puede cambiar tu día. Conecta con psicólogos certificados directamente desde tu chat empresarial.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: MessageCircle, title: "Chat 24/7", desc: "Escribe a cualquier hora. Recibe orientación profesional en minutos." },
              { icon: Brain, title: "Triage IA", desc: "Una IA empática evalúa tu situación y te conecta con el profesional adecuado." },
              { icon: HeartPulse, title: "Primeros auxilios emocionales", desc: "Manejo guiado de crisis, estrés y ansiedad con buenas prácticas clínicas." },
              { icon: Users, title: "Psicólogos certificados", desc: "Equipo multidisciplinario con experiencia en salud mental ocupacional." },
              { icon: ShieldCheck, title: "Confidencial", desc: "Tus conversaciones están cifradas. Tu empleador nunca verá su contenido." },
              { icon: Sparkles, title: "Recomendaciones personalizadas", desc: "Recursos, ejercicios y rutinas según tu progreso." },
            ].map((f) => (
              <div key={f.title} className="group bg-card-grad border border-border rounded-2xl p-6 shadow-soft hover:shadow-elegant hover:-translate-y-1 transition-smooth">
                <div className="h-12 w-12 rounded-xl bg-cta flex items-center justify-center mb-5 group-hover:scale-110 transition-smooth">
                  <f.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-display font-bold text-xl text-primary mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section id="beneficios" className="py-24 bg-soft">
        <div className="container grid md:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="absolute -inset-6 bg-cta opacity-20 blur-3xl rounded-full" />
            <div className="relative bg-white rounded-3xl p-8 shadow-elegant">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="h-10 w-10 rounded-xl bg-cta flex items-center justify-center">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-display font-bold text-primary">Triage IA</div>
                  <div className="text-xs text-muted-foreground">Evaluación inicial inteligente</div>
                </div>
              </div>
              <div className="py-4 space-y-3">
                {[
                  "¿Cómo describirías tu estado emocional ahora?",
                  "¿Hace cuánto te sientes así?",
                  "¿Hay algo específico que lo haya desencadenado?",
                ].map((q, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className="h-6 w-6 rounded-full bg-secondary text-primary flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                    <span className="text-foreground">{q}</span>
                  </div>
                ))}
              </div>
              <div className="bg-secondary rounded-xl p-3 text-xs text-muted-foreground">
                ✦ La IA prepara un resumen para tu psicólogo, ahorrando tiempo en la sesión.
              </div>
            </div>
          </div>

          <div>
            <span className="text-accent font-semibold text-sm uppercase tracking-wider">Para colaboradores</span>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl mt-3 mb-6 text-primary">
              Apoyo emocional que se adapta a tu ritmo de trabajo.
            </h2>
            <ul className="space-y-4">
              {[
                "Sin agendar citas: escribe cuando lo necesites.",
                "Acceso desde tu computador o móvil.",
                "Alertas inteligentes que te recuerdan cuidarte.",
                "Plan activo gestionado por tu empresa, sin costo adicional.",
              ].map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-success shrink-0 mt-0.5" />
                  <span className="text-foreground/90">{b}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="hero" size="lg" className="mt-8">
              <Link to="/login">Ingresar a mi panel <ArrowRight /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* EMPRESAS */}
      <section id="empresas" className="py-24">
        <div className="container">
          <div className="bg-hero rounded-3xl p-10 md:p-16 text-primary-foreground relative overflow-hidden shadow-elegant">
            <div className="absolute top-6 right-8 text-white/10 text-8xl font-black">×</div>
            <div className="absolute bottom-6 left-8 text-white/10 text-6xl font-black">+</div>
            <div className="relative grid md:grid-cols-[1fr_auto] gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 mb-4 text-sm bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
                  <Building2 className="h-4 w-4" /> Para empresas
                </div>
                <h2 className="font-display font-extrabold text-4xl md:text-5xl mb-4">
                  Cuida la salud mental de tu equipo.
                </h2>
                <p className="text-white/85 text-lg max-w-2xl">
                  Activa AliviApp para tus colaboradores y entrega un canal seguro de bienestar emocional con seguimiento, métricas y soporte clínico continuo.
                </p>
              </div>
              <Button asChild variant="soft" size="xl">
                <a href="mailto:contacto@aliviapp.com.co">Solicitar demo</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contacto" className="bg-primary-deep text-primary-foreground pt-16 pb-8">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <Logo variant="light" />
              <p className="text-white/70 text-sm mt-4 max-w-xs">
                Tu salud emocional conectada en un solo chat.
              </p>
              <div className="flex gap-3 mt-5">
                {[Facebook, Instagram, Youtube].map((Icon, i) => (
                  <a key={i} href="#" className="h-9 w-9 rounded-full bg-white/10 hover:bg-accent transition-smooth flex items-center justify-center">
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
                <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="h-9 w-9 rounded-full bg-white/10 hover:bg-accent transition-smooth flex items-center justify-center">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.48a8.2 8.2 0 004.77 1.52V7.56a4.84 4.84 0 01-1.01-.87z" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-display font-bold mb-4">AliviApp</h4>
              <ul className="space-y-2 text-sm text-white/75">
                <li><a href="#" className="hover:text-accent">Inicio</a></li>
                <li><a href="#servicio" className="hover:text-accent">Servicio</a></li>
                <li><a href="#empresas" className="hover:text-accent">Empresas</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-white/75">
                <li><a href="#" className="hover:text-accent">Términos y condiciones</a></li>
                <li><a href="#" className="hover:text-accent">Política de privacidad</a></li>
                <li><a href="#" className="hover:text-accent">Consentimiento informado</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-bold mb-4">Contacto</h4>
              <ul className="space-y-2 text-sm text-white/75">
                <li>contacto@aliviapp.com.co</li>
                <li>+57 310 274 0308</li>
                <li>Cúcuta, Colombia</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center text-xs text-white/60">
            AliviApp ©2026 · Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
