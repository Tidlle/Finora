/**
 * Logo da Finora
 * Design: Minimalismo Corporativo Sofisticado
 * - Texto "Finora" em branco com ícone abstrato de crescimento
 * - Visual minimalista, sem símbolos complexos
 */

export function FinoraLogo({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeClasses[size]} flex items-center justify-center`}>
        {/* Ícone abstrato: gráfico de crescimento minimalista */}
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Fundo */}
          <rect width="32" height="32" rx="6" fill="#FACC15" />
          {/* Barras de crescimento */}
          <rect x="6" y="20" width="4" height="6" fill="#000000" />
          <rect x="14" y="14" width="4" height="12" fill="#000000" />
          <rect x="22" y="8" width="4" height="18" fill="#000000" />
        </svg>
      </div>
      <span className={`font-display ${textSizeClasses[size]} text-foreground font-bold tracking-tight`}>
        Finora
      </span>
    </div>
  );
}
