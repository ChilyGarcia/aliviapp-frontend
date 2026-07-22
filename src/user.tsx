import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import {
    MessageCircle,
    ShieldCheck,
    Brain,
    Clock,
    HeartPulse,
    Sparkles,
    ArrowRight,
    CheckCircle2,
    Lock,
    Globe2,
    Star,
    Facebook,
    Instagram,
    Youtube,
    CreditCard,
} from "lucide-react";
import heroImg from "@/assets/hero-psychologist.jpg";

const TikTokIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.48a8.2 8.2 0 004.77 1.52V7.56a4.84 4.84 0 01-1.01-.87z" />
    </svg>
);

const UsersLanding = () => {
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* NAV */}
            <header className="absolute top-0 left-0 right-0 z-20">
                <div className="container flex items-center justify-between py-5">
                    <Logo variant="light" />
                    <nav className="hidden md:flex items-center gap-8 text-sm text-white/80">
                        <a href="#servicio" className="hover:text-white transition-smooth">Servicio</a>
                        <a href="#beneficios" className="hover:text-white transition-smooth">Beneficios</a>
                        <a href="#precio" className="hover:text-white transition-smooth">Precio</a>
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
                <div className="absolute top-24 left-10 text-white/10 text-7xl font-black select-none hidden md:block">×</div>
                <div className="absolute bottom-20 left-20 text-white/15 text-5xl font-black select-none hidden md:block">×</div>
                <div className="absolute top-1/3 right-10 text-white/10 text-6xl font-black select-none hidden md:block">+</div>

                <div className="container relative pt-28 pb-20 md:pt-40 md:pb-32 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                    <div className="animate-fade-in">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-medium mb-6">
                            <Globe2 className="h-3.5 w-3.5" />
                            Hecho para hispanohablantes en EE.UU.
                        </div>

                        <h1 className="font-display italic font-extrabold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[0.95] mb-6">
                            Tu psicólogo,<br />
                            <span className="text-accent">en tu idioma</span><br />
                            y a un chat.
                        </h1>

                        <p className="text-base sm:text-lg md:text-xl text-white/85 max-w-xl mb-8 leading-relaxed">
                            Acompañamiento psicológico por chat con <strong className="text-white">profesionales hispanohablantes</strong>,
                            y <strong className="text-white">atención por videollamada en momentos críticos</strong> que requieran un acompañamiento más cercano.
                            Sin agendar, sin barreras de idioma, sin esperas. Para ti, dondequiera que estés en EE.UU.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <Button asChild variant="hero" size="xl">
                                <a href="#precio">
                                    Empezar por $150/mes
                                    <ArrowRight className="ml-1" />
                                </a>
                            </Button>
                            <Button asChild variant="soft" size="xl">
                                <a href="#servicio">Cómo funciona</a>
                            </Button>
                        </div>

                        <div className="mt-8 md:mt-10 flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-white/75">
                            <div className="flex items-center gap-2"><Lock className="h-4 w-4" /> 100% confidencial</div>
                            <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> Disponible 24/7</div>
                            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Psicólogos certificados</div>
                        </div>
                    </div>

                    {/* Hero card */}
                    <div className="relative animate-fade-in hidden md:block">
                        <div className="absolute -inset-4 bg-accent/30 blur-3xl rounded-full" />
                        <div className="relative bg-white text-foreground rounded-3xl p-6 shadow-elegant max-w-md ml-auto">
                            <div className="flex items-start gap-4">
                                <img
                                    src={heroImg}
                                    alt="Psicóloga hispanohablante"
                                    width={120}
                                    height={120}
                                    className="h-24 w-24 rounded-2xl object-cover object-top"
                                />
                                <div className="flex-1">
                                    <div className="text-xs text-muted-foreground">En línea ahora</div>
                                    <div className="font-display font-bold text-lg text-primary">
                                        Dra. Camila Rojas
                                    </div>
                                    <div className="text-xs text-muted-foreground">Psicóloga clínica</div>
                                    <div className="mt-2 flex items-center gap-1 text-xs">
                                        <span className="h-2 w-2 rounded-full bg-success" />
                                        <span className="text-success font-medium">Disponible</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 space-y-2">
                                <div className="bg-secondary text-sm rounded-2xl rounded-tl-sm p-3 max-w-[85%]">
                                    Hola 👋 Soy Camila. Cuéntame en confianza qué te tiene preocupado hoy.
                                </div>
                                <div className="bg-cta text-primary-foreground text-sm rounded-2xl rounded-tr-sm p-3 max-w-[85%] ml-auto">
                                    Estoy lejos de mi familia y me siento muy ansioso últimamente…
                                </div>
                            </div>

                            <Button asChild variant="hero" size="default" className="w-full mt-5">
                                <a href="#precio">Empezar mi plan</a>
                            </Button>
                        </div>
                    </div>
                </div>

                <svg className="absolute bottom-0 left-0 w-full h-12 text-background" viewBox="0 0 1440 80" preserveAspectRatio="none">
                    <path fill="currentColor" d="M0,40 C360,90 1080,-10 1440,40 L1440,80 L0,80 Z" />
                </svg>
            </section>

            {/* SERVICIO */}
            <section id="servicio" className="py-24">
                <div className="container">
                    <div className="max-w-2xl mb-14">
                        <span className="text-accent font-semibold text-sm uppercase tracking-wider">Pensado para ti</span>
                        <h2 className="font-display font-extrabold text-4xl md:text-5xl mt-3 mb-4 text-primary">
                            Salud mental sin barreras de idioma ni cultura.
                        </h2>
                        <p className="text-muted-foreground text-lg">
                            Vivir lejos de casa, adaptarse a una nueva cultura o sostener a la familia trae retos únicos.
                            Conecta con psicólogos que entienden tu historia, hablan tu idioma y respetan tus raíces.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { icon: MessageCircle, title: "Chat 24/7 en español", desc: "Escribe a cualquier hora desde tu celular o computador." },
                            { icon: Brain, title: "Triage IA en español", desc: "Una IA evalúa tu situación y te conecta con el profesional ideal." },
                            { icon: HeartPulse, title: "Apoyo en momentos difíciles", desc: "Manejo de ansiedad, duelo migratorio, estrés laboral y más." },
                            { icon: Globe2, title: "Cultura latina", desc: "Profesionales que entienden tu contexto familiar, religioso y migratorio." },
                            { icon: ShieldCheck, title: "100% confidencial", desc: "Conversaciones cifradas. Solo tú y tu psicólogo." },
                            { icon: Sparkles, title: "Recursos personalizados", desc: "Ejercicios, lecturas y rutinas para tu bienestar diario." },
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
                    <div>
                        <span className="text-accent font-semibold text-sm uppercase tracking-wider">Para ti</span>
                        <h2 className="font-display font-extrabold text-4xl md:text-5xl mt-3 mb-6 text-primary">
                            Más cerca de tu bienestar, más cerca de los tuyos.
                        </h2>
                        <ul className="space-y-4">
                            {[
                                "Sin agendar citas: escribe cuando lo necesites.",
                                "Sin seguro médico ni papeleo. Solo tú y tu psicólogo.",
                                "Respeto por tu cultura, tradiciones y familia.",
                                "Cancela cuando quieras, sin permanencia.",
                            ].map((b) => (
                                <li key={b} className="flex items-start gap-3">
                                    <CheckCircle2 className="h-6 w-6 text-success shrink-0 mt-0.5" />
                                    <span className="text-foreground/90">{b}</span>
                                </li>
                            ))}
                        </ul>
                        <Button asChild variant="hero" size="lg" className="mt-8">
                            <a href="#precio">Ver mi plan <ArrowRight /></a>
                        </Button>
                    </div>

                    <div className="relative">
                        <div className="absolute -inset-6 bg-cta opacity-20 blur-3xl rounded-full" />
                        <div className="relative bg-white rounded-3xl p-8 shadow-elegant">
                            <div className="flex items-center gap-2 mb-4">
                                {[1, 2, 3, 4, 5].map((i) => (<Star key={i} className="h-5 w-5 fill-warning text-warning" />))}
                                <span className="text-sm text-muted-foreground ml-2">4.9 / 5</span>
                            </div>
                            <p className="text-foreground/90 italic leading-relaxed">
                                "Llevo 3 años en Houston y nunca había encontrado un psicólogo que me entendiera de verdad.
                                Hablar en español con alguien que conoce mi cultura cambió todo. Me siento escuchada."
                            </p>
                            <div className="mt-5 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-cta flex items-center justify-center text-primary-foreground font-bold">M</div>
                                <div>
                                    <div className="font-display font-bold text-primary text-sm">María G.</div>
                                    <div className="text-xs text-muted-foreground">Houston, TX 🇲🇽</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* PRECIO */}
            <section id="precio" className="py-24">
                <div className="container">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <span className="text-accent font-semibold text-sm uppercase tracking-wider">Plan único</span>
                        <h2 className="font-display font-extrabold text-4xl md:text-5xl mt-3 mb-4 text-primary">
                            Una tarifa simple, todo incluido.
                        </h2>
                        <p className="text-muted-foreground text-lg">
                            Acceso ilimitado a tu acompañamiento psicológico.
                        </p>
                    </div>

                    <div className="max-w-md mx-auto">
                        <div className="relative bg-hero text-primary-foreground rounded-3xl p-8 shadow-elegant overflow-hidden">
                            <div className="absolute top-4 right-4 text-white/10 text-7xl font-black">+</div>
                            <h3 className="font-display font-extrabold text-3xl mb-2">Plan AliviApp</h3>
                            <p className="text-white/75 text-sm mb-6">Acompañamiento ilimitado por chat.</p>

                            <div className="flex items-baseline gap-2 mb-6">
                                <span className="text-5xl font-display font-extrabold">$50</span>
                                <span className="text-white/80">USD / mes</span>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {[
                                    "Chat ilimitado con psicólogos certificados",
                                    "Disponibilidad 24/7 en español",
                                    "Videollamadas en momentos críticos",
                                    "Triage con IA en español",
                                    "Biblioteca de recursos y ejercicios",
                                    "Check-ins emocionales semanales",
                                ].map((b) => (
                                    <li key={b} className="flex items-start gap-2 text-sm">
                                        <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                                        <span className="text-white/90">{b}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button asChild variant="hero" size="xl" className="w-full">
                                <Link to="/login">
                                    <CreditCard className="h-5 w-5" /> Suscribirme ahora
                                </Link>
                            </Button>
                            <p className="text-center text-xs text-white/60 mt-4">
                                Atención cercana en tu idioma
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA FINAL */}
            <section className="pb-16 sm:pb-24">
                <div className="container">
                    <div className="bg-soft rounded-3xl px-5 py-8 sm:p-10 md:p-12 text-center">
                        <h3 className="font-display font-extrabold text-xl sm:text-2xl md:text-3xl text-primary mb-3 leading-tight">
                            Da el primer paso hacia tu bienestar emocional.
                        </h3>
                        <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-xl mx-auto">
                            Conecta hoy con un psicólogo hispanohablante y empieza a sentirte mejor desde el primer mensaje.
                        </p>
                        <Button asChild variant="hero" size="lg" className="w-full sm:w-auto">
                            <a href="#precio">
                                <span className="truncate">Empezar mi acompañamiento</span>
                                <ArrowRight className="ml-1 shrink-0" />
                            </a>
                        </Button>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <Footer />
        </div>
    );
};

export default UsersLanding;
