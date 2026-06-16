import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
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
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:block space-y-6 pr-8">
          <FinoraLogo size="lg" />
          <h1 className="text-4xl font-display font-bold">Tenha clareza sobre cada decisão financeira.</h1>
          <p className="text-muted-foreground text-lg">Acesse seu painel para acompanhar saldo, despesas e metas em um só lugar.</p>
          <Card className="border-border bg-secondary/40">
            <CardContent className="p-6 space-y-5">
              <div>
                <p className="text-xs uppercase text-muted-foreground">API conectada</p>
                <p className="text-3xl font-display font-bold text-accent mt-2">Finora</p>
              </div>
              <p className="text-sm text-muted-foreground">Entre com uma conta cadastrada pelo back-end Spring Boot.</p>
            </CardContent>
          </Card>
        </div>

        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="lg:hidden flex justify-center"><FinoraLogo size="lg" /></div>
          <div className="space-y-2">
            <h2 className="text-3xl font-display font-bold text-foreground">Bem-vindo de volta</h2>
            <p className="text-muted-foreground">Entre para acompanhar suas finanças.</p>
          </div>

          <Card className="border-border">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" autoComplete="email" placeholder="seu@email.com" value={email} onChange={(event) => setEmail(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} />
                </div>
                <div className="rounded-md bg-secondary p-3 text-xs text-muted-foreground">
                  Use uma conta cadastrada pela API da Finora. A autenticação agora usa JWT.
                </div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</Button>
                <p className="text-center text-sm text-muted-foreground">
                  Ainda não possui uma conta?{" "}
                  <Link href="/signup" className="text-accent hover:text-accent/80 transition-colors">Criar conta</Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
