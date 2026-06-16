import { useEffect, useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useFinora } from "@/contexts/FinoraContext";

export default function ProfilePage() {
  const { currentUser, updateProfile, changePassword, logout } = useFinora();
  const [, setLocation] = useLocation();
  const [fullName, setFullName] = useState(currentUser?.fullName ?? "");
  const [email, setEmail] = useState(currentUser?.email ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirmation: "" });
  const initials = (currentUser?.fullName ?? "Finora").split(" ").slice(0, 2).map((word) => word[0]).join("").toUpperCase();

  useEffect(() => {
    setFullName(currentUser?.fullName ?? "");
    setEmail(currentUser?.email ?? "");
  }, [currentUser]);

  async function handleProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fullName.trim() || !email.trim()) return toast.error("Informe nome e e-mail.");

    setSavingProfile(true);
    const result = await updateProfile(fullName, email);
    setSavingProfile(false);

    if (!result.ok) return toast.error(result.message);
    toast.success("Dados pessoais atualizados.");
  }

  async function handlePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (passwords.next.length < 8 || !/[A-Z]/.test(passwords.next) || !/\d/.test(passwords.next)) return toast.error("A nova senha deve ter 8 caracteres, número e letra maiúscula.");
    if (passwords.next !== passwords.confirmation) return toast.error("As novas senhas não coincidem.");

    setSavingPassword(true);
    const result = await changePassword(passwords.current, passwords.next);
    setSavingPassword(false);

    if (!result.ok) return toast.error(result.message);
    setPasswords({ current: "", next: "", confirmation: "" });
    toast.success("Senha alterada.");
  }

  function handleLogout() {
    logout();
    setLocation("/login");
  }

  return (
    <AppShell title="Perfil" subtitle="Gerencie suas informações pessoais e sua segurança.">
      <div className="max-w-3xl space-y-6">
        <Card className="border-border">
          <CardContent className="p-6 sm:p-8 flex items-center gap-5">
            <Avatar className="w-16 h-16 sm:w-20 sm:h-20"><AvatarFallback className="bg-accent text-accent-foreground text-xl font-bold">{initials}</AvatarFallback></Avatar>
            <div><h2 className="text-xl sm:text-2xl font-display font-bold">{currentUser?.fullName}</h2><p className="text-muted-foreground">{currentUser?.email}</p><p className="text-sm text-muted-foreground mt-2">Membro desde {currentUser ? new Date(currentUser.createdAt).toLocaleDateString("pt-BR") : "—"}</p></div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader><CardTitle>Dados pessoais</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleProfile} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="fullName">Nome completo</Label><Input id="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
              <Button type="submit" disabled={savingProfile}>{savingProfile ? "Salvando..." : "Salvar alterações"}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="text-accent" /> Segurança</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handlePassword} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="current">Senha atual</Label><Input id="current" type="password" value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} /></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="next">Nova senha</Label><Input id="next" type="password" value={passwords.next} onChange={(event) => setPasswords({ ...passwords, next: event.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="confirmation">Confirmar nova senha</Label><Input id="confirmation" type="password" value={passwords.confirmation} onChange={(event) => setPasswords({ ...passwords, confirmation: event.target.value })} /></div>
              </div>
              <Button type="submit" variant="outline" disabled={savingPassword}>{savingPassword ? "Alterando..." : "Alterar senha"}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader><CardTitle className="text-red-400">Sessão</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground mb-4">Sair da conta encerra a sessão atual neste navegador.</p><Button variant="destructive" onClick={handleLogout}><LogOut />Sair da conta</Button></CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
