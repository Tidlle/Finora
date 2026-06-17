import { useEffect, useState } from "react";
import { FinoraLogo } from "./FinoraLogo";
import { Button } from "./ui/button";
import { LayoutDashboard, Wallet, Tag, Target, User, TrendingUp, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useFinora } from "@/contexts/FinoraContext";
import { listarMetas } from "@/services/metaService";
import { classificarAlertasMetas } from "@/lib/metaAlertas";

const mainItems = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
  { label: "Transações", href: "/transactions", icon: <Wallet size={20} /> },
  { label: "Categorias", href: "/categories", icon: <Tag size={20} /> },
  { label: "Metas", href: "/goals", icon: <Target size={20} /> },
  { label: "Perfil", href: "/profile", icon: <User size={20} /> },
];

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { logout, isAuthenticated } = useFinora();
  const [goalAlertCount, setGoalAlertCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    listarMetas()
      .then((metas) => {
        const alertas = classificarAlertasMetas(metas);
        const urgentes = alertas.filter(
          (a) => a.tipo === "vencida" || a.tipo === "prazoProximo"
        );
        setGoalAlertCount(urgentes.length);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  function handleLogout() {
    logout();
    setLocation("/login");
  }

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 bg-background border-r border-border h-screen sticky top-0">
        <div className="p-6 border-b border-border">
          <FinoraLogo size="md" />
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2" aria-label="Navegação principal">
          {mainItems.map((item) => {
            const isActive = location === item.href;
            const showBadge = item.href === "/goals" && goalAlertCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 ${
                  isActive ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-secondary"
                }`}
              >
                {item.icon}
                <span className="font-medium text-sm">{item.label}</span>
                {showBadge && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {goalAlertCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-border">
          <p className="text-xs font-heading text-muted-foreground uppercase tracking-wider mb-3">Análise avançada</p>
          <Link
            href="/future"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 ${
              location === "/future" ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-secondary"
            }`}
          >
            <TrendingUp size={20} />
            <span className="font-medium text-sm">Projeções</span>
          </Link>
        </div>

        <div className="p-4 border-t border-border">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut size={18} />
            Sair
          </Button>
        </div>
      </aside>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 h-16 bg-background/95 backdrop-blur border-t border-border px-2" aria-label="Navegação mobile">
        <div className="grid grid-cols-5 h-full">
          {mainItems.map((item) => {
            const isActive = location === item.href;
            const showBadge = item.href === "/goals" && goalAlertCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center gap-1 text-[11px] transition-colors ${
                  isActive ? "text-accent" : "text-muted-foreground"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {showBadge && (
                  <span className="absolute top-1 right-3 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
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
