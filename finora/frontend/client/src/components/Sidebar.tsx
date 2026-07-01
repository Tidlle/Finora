import { useEffect, useState } from "react";
import { FinoraLogo } from "./FinoraLogo";
import { Button } from "./ui/button";
import { LayoutDashboard, Wallet, Tag, Target, User, TrendingUp, LogOut, FileBarChart } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useFinora } from "@/contexts/FinoraContext";
import { listarMetas } from "@/services/metaService";
import { classificarAlertasMetas } from "@/lib/metaAlertas";

const mainItems = [
  { label: "Dashboard",   href: "/dashboard",    icon: LayoutDashboard },
  { label: "Transações",  href: "/transactions", icon: Wallet },
  { label: "Categorias",  href: "/categories",   icon: Tag },
  { label: "Metas",       href: "/goals",        icon: Target },
  { label: "Projeções",   href: "/future",       icon: TrendingUp },
  { label: "Relatório",   href: "/report",       icon: FileBarChart },
  { label: "Perfil",      href: "/profile",      icon: User },
];

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { logout, isAuthenticated, currentUser } = useFinora();
  const [goalAlertCount, setGoalAlertCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    listarMetas()
      .then((metas) => {
        const alertas = classificarAlertasMetas(metas);
        setGoalAlertCount(alertas.filter((a) => a.tipo === "vencida" || a.tipo === "prazoProximo").length);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  function handleLogout() {
    logout();
    setLocation("/login");
  }

  const initials = currentUser?.fullName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() ?? "FN";

  return (
    <>
      {/* ── Desktop sidebar ────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 bg-background border-r border-border h-screen sticky top-0">
        <div className="px-5 py-5 border-b border-border">
          <FinoraLogo size="md" />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" aria-label="Navegação principal">
          {mainItems.map(({ label, href, icon: Icon }) => {
            const isActive = location === href || (href !== "/" && location.startsWith(href));
            const showBadge = href === "/goals" && goalAlertCount > 0;

            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon size={17} className="shrink-0" />
                <span>{label}</span>
                {showBadge && (
                  <span className="ml-auto flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white min-w-[18px] px-1">
                    {goalAlertCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-border space-y-2">
          {currentUser && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/50 mb-1">
              <div className="w-7 h-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{currentUser.fullName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{currentUser.email}</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Sair da conta
          </Button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ──────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-50 h-16 bg-background/95 backdrop-blur border-t border-border"
        aria-label="Navegação mobile"
      >
        <div className="grid grid-cols-5 h-full px-1">
          {mainItems.slice(0, 5).map(({ label, href, icon: Icon }) => {
            const isActive = location === href;
            const showBadge = href === "/goals" && goalAlertCount > 0;
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                  isActive ? "text-accent" : "text-muted-foreground"
                }`}
              >
                <Icon size={20} />
                <span>{label}</span>
                {showBadge && (
                  <span className="absolute top-2 right-3 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                    {goalAlertCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
