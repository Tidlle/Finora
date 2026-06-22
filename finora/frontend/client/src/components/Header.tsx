import { Avatar, AvatarFallback } from "./ui/avatar";
import { useFinora } from "@/contexts/FinoraContext";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { currentUser } = useFinora();
  const initials = currentUser?.fullName
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() ?? "FN";

  const hoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <header className="bg-background/95 backdrop-blur border-b border-border sticky top-0 z-40">
      <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-display font-bold text-foreground truncate leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:block text-xs text-muted-foreground capitalize">{hoje}</span>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-foreground leading-tight">
                {currentUser?.fullName?.split(" ")[0] ?? "Usuário"}
              </p>
            </div>
            <Avatar className="w-8 h-8 sm:w-9 sm:h-9 ring-2 ring-border hover:ring-accent/50 transition-all cursor-pointer">
              <AvatarFallback className="bg-accent text-accent-foreground font-bold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
