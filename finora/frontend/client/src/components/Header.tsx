import { Bell } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useFinora } from "@/contexts/FinoraContext";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showNotifications?: boolean;
}

export function Header({ title, subtitle, showNotifications = true }: HeaderProps) {
  const { currentUser } = useFinora();
  const initials = currentUser?.fullName
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() ?? "FN";

  return (
    <header className="bg-background/95 backdrop-blur border-b border-border sticky top-0 z-40">
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground truncate">{title}</h1>
          {subtitle && <p className="text-xs sm:text-sm text-muted-foreground truncate">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {showNotifications && (
            <Button variant="ghost" size="icon" className="relative" title="Notificações — recurso futuro" disabled>
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
            </Button>
          )}
          <Avatar className="w-9 h-9 sm:w-10 sm:h-10">
            <AvatarFallback className="bg-accent text-accent-foreground font-bold">{initials}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
