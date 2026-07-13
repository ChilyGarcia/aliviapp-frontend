import { Heart } from "lucide-react";

interface LogoProps {
  variant?: "light" | "dark";
  className?: string;
}

export const Logo = ({ variant = "dark", className = "" }: LogoProps) => {
  const textColor = variant === "light" ? "text-white" : "text-primary";
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className="h-8 w-8 rounded-lg bg-cta flex items-center justify-center shadow-soft">
          <Heart className="h-4 w-4 text-white fill-white" />
        </div>
        <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-background" />
      </div>
      <span className={`font-display font-extrabold text-xl tracking-tight ${textColor}`}>
        Alivi<span className="text-accent">App</span>
      </span>
    </div>
  );
};
