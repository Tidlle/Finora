import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { BarChart3, PieChart, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FinoraLogo } from "@/components/FinoraLogo";
import { useFinora } from "@/contexts/FinoraContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useFinora();
  const [, setLocation] = useLocation();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Informe seu e-mail e sua senha.");
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Login realizado com sucesso.");
    setLocation("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center">

        {/* ── Left panel ─────────────────────────────────────── */}
        <div className="hidden lg:flex flex-col justify-between h-full py-4 pr-8 space-y-10">
          <FinoraLogo size="lg" />
          <div className="space-y-6">
            <h1 className="text-4xl font-display font-bold leading-tight">
              Clareza sobre cada<br />
              <span className="text-gradient">decisão financeira.</span>
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Dashboard, metas, categorias e importação com IA — tudo em um painel seguro e moderno.
            </p>
            <div className="space-y-3">
              {[
                { icon: BarChart3, text: "Dashboard com gráficos e filtros" },
                { icon: Target,    text: "Metas com progresso visual" },
                { icon: PieChart,  text: "Categorias de receitas e despesas" },
                { icon: Sparkles,  text: "IA que sugere categorias no CSV" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-accent" />
                  </div>
                  {text}
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Finora</p>
        </div>

        {/* ── Form ───────────────────────────────────────────── */}
        <div className="w-full max-w-md mx-auto space-y-6 animate-fade-in">
          <div className="lg:hidden flex justify-center mb-2">
            <FinoraLogo size="lg" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-display font-bold text-foreground">Bem-vindo de volta</h2>
            <p className="text-sm text-muted-foreground">Entre para acompanhar suas finanças.</p>
          </div>

          <Card className="border-border">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full mt-2" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Não tem uma conta?{" "}
                  <Link href="/signup" className="text-accent hover:text-accent/80 font-medium transition-colors">
                    Criar conta
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
