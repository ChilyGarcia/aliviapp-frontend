import { Logo } from "@/components/Logo";

/* ── Social SVG icons ─────────────────────────────────────────────────── */
const FacebookIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} width="16" height="16">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} width="16" height="16">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} width="16" height="16">
        <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
        <path d="m10 15 5-3-5-3z" />
    </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.48a8.2 8.2 0 004.77 1.52V7.56a4.84 4.84 0 01-1.01-.87z" />
    </svg>
);

const SOCIAL_LINKS = [
    { label: "Facebook", href: "https://facebook.com", Icon: FacebookIcon },
    { label: "Instagram", href: "https://instagram.com", Icon: InstagramIcon },
    { label: "YouTube", href: "https://youtube.com", Icon: YoutubeIcon },
    { label: "TikTok", href: "https://tiktok.com", Icon: TikTokIcon },
];

/* ── Footer component ─────────────────────────────────────────────────── */
export const Footer = () => (
    <footer id="contacto" className="bg-primary-deep text-primary-foreground pt-16 pb-8">
        <div className="container">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10 mb-10">
                {/* Brand */}
                <div>
                    <Logo variant="light" />
                    <p className="text-white/70 text-sm mt-4 max-w-xs">
                        Tu salud emocional, en tu idioma.
                    </p>
                    <div className="flex gap-3 mt-5">
                        {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                            <a
                                key={label}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={label}
                                className="h-9 w-9 rounded-full bg-white/10 hover:bg-accent transition-smooth flex items-center justify-center"
                            >
                                <Icon className="h-4 w-4" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Nav */}
                <div>
                    <h4 className="font-display font-bold mb-4">AliviApp</h4>
                    <ul className="space-y-2 text-sm text-white/75">
                        <li><a href="#servicio" className="hover:text-accent transition-smooth">Servicio</a></li>
                        <li><a href="#beneficios" className="hover:text-accent transition-smooth">Beneficios</a></li>
                        <li><a href="#precio" className="hover:text-accent transition-smooth">Precio</a></li>
                    </ul>
                </div>

                {/* Legal */}
                <div>
                    <h4 className="font-display font-bold mb-4">Legal</h4>
                    <ul className="space-y-2 text-sm text-white/75">
                        <li><a href="/terminos" className="hover:text-accent transition-smooth">Términos y condiciones</a></li>
                        <li><a href="/privacidad" className="hover:text-accent transition-smooth">Política de privacidad</a></li>
                        <li><a href="/consentimiento" className="hover:text-accent transition-smooth">Consentimiento informado</a></li>
                    </ul>
                </div>

                {/* Contact */}
                <div>
                    <h4 className="font-display font-bold mb-4">Contacto</h4>
                    <ul className="space-y-2 text-sm text-white/75">
                        <li className="break-all">
                            <a href="mailto:contacto@aliviapp.com.co" className="hover:text-accent transition-smooth">
                                contacto@aliviapp.com.co
                            </a>
                        </li>
                        <li>
                            <a href="tel:+573102740308" className="hover:text-accent transition-smooth">
                                +57 310 274 0308
                            </a>
                        </li>
                        <li>Soporte en español</li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-white/10 pt-6 text-center text-xs text-white/60">
                AliviApp ©{new Date().getFullYear()} · Todos los derechos reservados.
            </div>
        </div>
    </footer>
);
