import { useMemo, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { CheckCircle2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FinoraLogo } from "@/components/FinoraLogo";
import { useFinora } from "@/contexts/FinoraContext";

const strengthLabel = ["Fraca", "Média", "Forte"];
const strengthColor = ["bg-red-500", "bg-yellow-500", "bg-green-500"];

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useFinora();
  const [, setLocation] = useLocation();

  const strength = useMemo(() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    return s;
  }, [password]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    if (password.length < 8 || strength < 2) {
      toast.error("A senha deve ter 8 caracteres, número e letra maiúscula.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (!acceptedTerms) {
      toast.error("Aceite os termos de uso para continuar.");
      return;
    }
    setLoading(true);
    const result = await signup(name, email, password);
    setLoading(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Conta criada com sucesso.");
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
              Comece hoje a organizar<br />
              <span className="text-gradient">sua vida financeira.</span>
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Crie sua conta gratuitamente e tenha controle total sobre receitas,
              despesas e metas financeiras.
            </p>
            <div className="space-y-3">
              {[
                "Registro de receitas e despesas",
                "Metas financeiras com progresso visual",
                "Importação de CSV com sugestão de categorias por IA",
                "Dashboard com gráficos e filtros por período",
              ].map((benefit) => (
                <div key={benefit} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="text-green-400 shrink-0 mt-0.5" size={16} />
                  {benefit}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp size={13} className="text-accent" />
            Gratuito e sem cartão de crédito
          </div>
        </div>

        {/* ── Form ───────────────────────────────────────────── */}
        <div className="w-full max-w-md mx-auto space-y-6 animate-fade-in">
          <div className="lg:hidden flex justify-center mb-2">
            <FinoraLogo size="lg" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-display font-bold text-foreground">Criar conta</h2>
            <p className="text-sm text-muted-foreground">Comece a organizar suas finanças agora.</p>
          </div>

          <Card className="border-border">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input id="name" autoComplete="name" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" autoComplete="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} />
                  {password && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <span key={i} className={`h-1 flex-1 rounded-full transition-all ${i < strength ? strengthColor[strength - 1] : "bg-muted"}`} />
                        ))}
                      </div>
                      <p className="text-[11px] text-muted-foreground">Força: {strengthLabel[strength - 1] ?? "Fraca"}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar senha</Label>
                  <Input id="confirmPassword" type="password" autoComplete="new-password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
                <label className="flex items-start gap-2.5 text-sm text-muted-foreground cursor-pointer">
                  <Checkbox checked={acceptedTerms} onCheckedChange={(v) => setAcceptedTerms(v === true)} className="mt-0.5" />
                  <span>Li e aceito os <span className="text-accent">termos de uso</span> da Finora.</span>
                </label>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Criando conta..." : "Criar conta"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Já possui uma conta?{" "}
                  <Link href="/login" className="text-accent hover:text-accent/80 font-medium transition-colors">Entrar</Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
