import { Link } from "wouter";
import { ArrowRight, BarChart3, PieChart, Target, TrendingUp, Zap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FinoraLogo } from "@/components/FinoraLogo";
import { cn } from "@/lib/utils";

const features = [
  { icon: BarChart3, title: "Dashboard visual", description: "Visualize saldo, receitas e despesas de forma clara." },
  { icon: PieChart, title: "Categorias organizadas", description: "Entenda para onde seu dinheiro está indo." },
  { icon: Target, title: "Metas financeiras", description: "Crie objetivos e acompanhe sua evolução." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container h-16 flex items-center justify-between gap-3">
          <FinoraLogo size="md" />
          <nav className="hidden md:flex items-center gap-8" aria-label="Navegação pública">
            <a href="#recursos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
            <a href="#como-funciona" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Como funciona</a>
            <Link href="/future" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Em breve</Link>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "hidden sm:inline-flex")}>Entrar</Link>
            <Link href="/signup" className={buttonVariants({ size: "sm" })}>Criar conta</Link>
          </div>
        </div>
      </header>

      <section className="container py-16 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-7">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 text-accent px-3 py-1 text-sm"><TrendingUp size={15} /> Gestão financeira pessoal</span>
          <h1 className="text-4xl sm:text-5xl xl:text-6xl font-display font-bold text-foreground leading-tight">Organize suas finanças e alcance suas metas.</h1>
          <p className="text-lg text-muted-foreground max-w-xl">Controle receitas, acompanhe despesas e visualize seus objetivos financeiros em uma plataforma simples, moderna e segura.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>Começar gratuitamente <ArrowRight size={18} /></Link>
            <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>Ver demonstração</Link>
          </div>
        </div>

        <Card className="border-border bg-card/80 shadow-2xl shadow-accent/5">
          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="flex justify-between items-center"><p className="font-heading font-semibold">Dashboard</p><span className="text-xs text-muted-foreground">Maio de 2026</span></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-secondary rounded-lg p-3"><p className="text-[11px] text-muted-foreground">Saldo</p><p className="font-bold text-accent mt-1">R$ 4.280</p></div>
              <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3"><p className="text-[11px] text-muted-foreground">Receitas</p><p className="font-bold text-green-400 mt-1">R$ 5.850</p></div>
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3"><p className="text-[11px] text-muted-foreground">Despesas</p><p className="font-bold text-red-400 mt-1">R$ 1.569</p></div>
            </div>
            <div className="h-36 bg-secondary/60 rounded-lg p-4 flex items-end gap-5">
              {[48, 58, 54, 70, 80].map((height, index) => <div key={index} className="flex-1 flex flex-col justify-end gap-1 h-full"><div className="rounded-t bg-green-500/80" style={{ height: `${height}%` }} /><div className="rounded-t bg-red-500/80" style={{ height: `${height / 3}%` }} /></div>)}
            </div>
            <div className="space-y-2"><div className="flex justify-between text-xs"><span>Meta: Reserva de emergência</span><span className="text-accent">42%</span></div><div className="h-2 bg-muted rounded-full"><div className="h-full rounded-full bg-accent w-[42%]" /></div></div>
          </CardContent>
        </Card>
      </section>

      <section id="recursos" className="bg-secondary/30 py-16 sm:py-20">
        <div className="container space-y-10">
          <div className="text-center space-y-3"><h2 className="text-3xl sm:text-4xl font-display font-bold">Controle financeiro com clareza</h2><p className="text-muted-foreground max-w-2xl mx-auto">Tudo o que você precisa para acompanhar seus gastos e planejar objetivos.</p></div>
          <div className="grid md:grid-cols-3 gap-5">{features.map(({ icon: Icon, title, description }) => <Card key={title} className="border-border"><CardContent className="p-6 space-y-4"><Icon className="text-accent" size={30} /><h3 className="font-heading font-bold text-xl">{title}</h3><p className="text-muted-foreground">{description}</p></CardContent></Card>)}</div>
        </div>
      </section>

      <section id="como-funciona" className="container py-16 sm:py-20 space-y-10">
        <div className="text-center"><h2 className="text-3xl sm:text-4xl font-display font-bold">Como funciona</h2></div>
        <div className="grid md:grid-cols-3 gap-8">{[
          ["1", "Crie sua conta", "Comece com categorias prontas para organizar seus lançamentos."],
          ["2", "Registre transações", "Adicione receitas e despesas de forma simples."],
          ["3", "Acompanhe metas", "Visualize saldo, gráficos e progresso financeiro."],
        ].map(([number, title, description]) => <div key={number} className="text-center space-y-4"><div className="mx-auto w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold">{number}</div><h3 className="font-heading font-bold text-xl">{title}</h3><p className="text-muted-foreground">{description}</p></div>)}</div>
      </section>

      <section className="bg-secondary/30 py-16">
        <div className="container max-w-4xl">
          <Card className="border-accent/20 bg-accent/5"><CardContent className="p-7 sm:p-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"><div className="space-y-3"><span className="inline-flex items-center gap-2 text-accent text-sm"><Zap size={16} /> Evolução futura</span><h2 className="text-2xl font-display font-bold">Finora inteligente — em breve</h2><p className="text-muted-foreground">Análises personalizadas como: “Você gastou 35% mais com alimentação neste mês.”</p></div><Link href="/future" className={buttonVariants({ variant: "outline" })}>Conhecer evolução</Link></CardContent></Card>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="container py-8 flex flex-col sm:flex-row gap-4 justify-between items-center text-sm text-muted-foreground"><FinoraLogo size="sm" /><p>© 2026 Finora. Todos os direitos reservados.</p></div>
      </footer>
    </div>
  );
}
