import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DashboardContentProps = {
  children: ReactNode;
  /** Sin tope de ancho (chat, bandeja, notas). */
  fullWidth?: boolean;
  /** Contenido más estrecho (plan, perfil). */
  narrow?: boolean;
  className?: string;
};

/**
 * Limita y centra el contenido del panel en pantallas grandes.
 * Evita que grillas y cards se estiren de borde a borde.
 */
export const DashboardContent = ({
  children,
  fullWidth = false,
  narrow = false,
  className,
}: DashboardContentProps) => (
  <div
    className={cn(
      "animate-fade-in w-full",
      !fullWidth && (narrow ? "mx-auto max-w-4xl" : "mx-auto max-w-7xl"),
      className
    )}
  >
    {children}
  </div>
);
