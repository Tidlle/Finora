import { useMemo, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FinoraLogo } from "@/components/FinoraLogo";
import { useFinora } from "@/contexts/FinoraContext";

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
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    return score;
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
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:block space-y-6 pr-10">
          <FinoraLogo size="lg" />
          <h1 className="text-4xl font-display font-bold">Comece a organizar sua vida financeira hoje.</h1>
          <div className="space-y-4 text-muted-foreground">
            {["Registre receitas e despesas", "Acompanhe metas financeiras", "Visualize seu saldo com clareza"].map((benefit) => (
              <div className="flex items-center gap-3" key={benefit}><CheckCircle2 className="text-accent" size={20} /><span>{benefit}</span></div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="lg:hidden flex justify-center"><FinoraLogo size="lg" /></div>
          <div className="space-y-2">
            <h2 className="text-3xl font-display font-bold text-foreground">Crie sua conta</h2>
            <p className="text-muted-foreground">Comece a organizar suas finanças em poucos passos.</p>
          </div>
          <Card className="border-border">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input id="name" autoComplete="name" placeholder="Seu nome" value={name} onChange={(event) => setName(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" autoComplete="email" placeholder="seu@email.com" value={email} onChange={(event) => setEmail(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" autoComplete="new-password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} />
                  {password && (
                    <div className="flex gap-1 pt-1" aria-label="Força da senha">
                      {[0, 1, 2].map((item) => <span key={item} className={`h-1.5 flex-1 rounded-full ${item < strength ? "bg-accent" : "bg-muted"}`} />)}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar senha</Label>
                  <Input id="confirmPassword" type="password" autoComplete="new-password" placeholder="••••••••" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                </div>
                <label className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Checkbox checked={acceptedTerms} onCheckedChange={(checked) => setAcceptedTerms(checked === true)} className="mt-0.5" />
                  Li e aceito os termos de uso da Finora.
                </label>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? "Criando conta..." : "Criar conta"}</Button>
                <p className="text-center text-sm text-muted-foreground">
                  Já possui uma conta?{" "}<Link href="/login" className="text-accent hover:text-accent/80 transition-colors">Entrar</Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
