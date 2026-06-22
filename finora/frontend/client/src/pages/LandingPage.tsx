import { Link } from "wouter";
import {
  ArrowRight, BarChart3, PieChart, Target, TrendingUp, Zap, Upload,
  ShieldCheck, Sparkles, ChevronRight,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FinoraLogo } from "@/components/FinoraLogo";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: BarChart3,
    title: "Dashboard visual",
    description: "Saldo, receitas e despesas em cards limpos. Filtre por mês, período ou categoria.",
    accent: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: PieChart,
    title: "Categorias organizadas",
    description: "Gráficos de pizza e barras mostram exatamente para onde o seu dinheiro está indo.",
    accent: "text-green-400",
    bg: "bg-green-500/10",
  },
  {
    icon: Target,
    title: "Metas financeiras",
    description: "Crie objetivos, defina prazos e acompanhe o progresso com barras visuais.",
    accent: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Upload,
    title: "Importação CSV",
    description: "Importe extratos bancários com detecção automática de colunas e validação.",
    accent: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: Sparkles,
    title: "Finora Intelligence",
    description: "Sugestão automática de categorias ao importar CSV, com indicador de confiança.",
    accent: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: TrendingUp,
    title: "Projeções futuras",
    description: "Visualize tendências e saldo projetado para os próximos 6 meses.",
    accent: "text-green-400",
    bg: "bg-green-500/10",
  },
];

const steps = [
  { n: "01", title: "Crie sua conta",      desc: "Categorias padrão já criadas. Comece em menos de 1 minuto." },
  { n: "02", title: "Registre transações", desc: "Adicione receitas e despesas manualmente ou importe via CSV." },
  { n: "03", title: "Acompanhe metas",     desc: "Crie objetivos, monitore progresso e receba alertas de prazo." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container h-16 flex items-center justify-between gap-3">
          <FinoraLogo size="md" />
          <nav className="hidden md:flex items-center gap-8" aria-label="Navegação pública">
            <a href="#recursos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
            <a href="#como-funciona" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Como funciona</a>
            <a href="#inteligencia" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Inteligência</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex text-muted-foreground")}>
              Entrar
            </Link>
            <Link href="/signup" className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
              Criar conta <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="container py-20 sm:py-28 grid lg:grid-cols-2 gap-14 items-center">
        <div className="space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 text-accent px-4 py-1.5 text-sm font-medium">
            <Sparkles size={14} /> Inteligência financeira com IA
          </div>
          <h1 className="text-4xl sm:text-5xl xl:text-6xl font-display font-bold leading-[1.1]">
            Organize suas finanças.<br />
            <span className="text-gradient">Alcance suas metas.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
            Controle receitas, acompanhe despesas, visualize metas e importe extratos com
            categorização automática — tudo em uma plataforma segura e moderna.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "gap-2 glow-accent")}>
              Começar gratuitamente <ArrowRight size={18} />
            </Link>
            <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-border")}>
              Já tenho conta
            </Link>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-green-400" /> JWT seguro</span>
            <span className="flex items-center gap-1.5"><Zap size={13} className="text-accent" /> Deploy na nuvem</span>
            <span className="flex items-center gap-1.5"><Sparkles size={13} className="text-accent" /> IA integrada</span>
          </div>
        </div>

        {/* Dashboard mockup */}
        <Card className="border-border bg-card shadow-2xl shadow-black/40 animate-fade-in">
          <CardContent className="p-5 space-y-4">
            <div className="flex justify-between items-center">
              <p className="font-heading font-semibold text-sm">Dashboard</p>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">Junho 2026</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-secondary rounded-xl p-3 space-y-1">
                <p className="text-[10px] text-muted-foreground">Saldo</p>
                <p className="font-bold text-accent text-base">R$ 4.280</p>
              </div>
              <div className="bg-green-500/8 border border-green-500/15 rounded-xl p-3 space-y-1">
                <p className="text-[10px] text-muted-foreground">Receitas</p>
                <p className="font-bold text-green-400 text-base">R$ 5.850</p>
              </div>
              <div className="bg-red-500/8 border border-red-500/15 rounded-xl p-3 space-y-1">
                <p className="text-[10px] text-muted-foreground">Despesas</p>
                <p className="font-bold text-red-400 text-base">R$ 1.570</p>
              </div>
            </div>
            <div className="h-28 bg-secondary/50 rounded-xl p-3 flex items-end gap-3">
              {[40, 55, 48, 65, 72, 58].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end gap-0.5 h-full">
                  <div className="rounded-t-sm bg-green-400/70" style={{ height: `${h}%` }} />
                  <div className="rounded-t-sm bg-red-400/70" style={{ height: `${h * 0.45}%` }} />
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Meta: Reserva emergência</span>
                <span className="text-accent font-medium">68%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-accent w-[68%]" />
              </div>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-accent/8 border border-accent/15">
              <Sparkles size={12} className="text-accent shrink-0" />
              <p className="text-[11px] text-accent/90">Finora Intelligence sugeriu 4 categorias automaticamente</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section id="recursos" className="bg-secondary/20 border-y border-border py-20 sm:py-24">
        <div className="container space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-display font-bold">Controle financeiro completo</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Tudo que você precisa para organizar suas finanças pessoais em um só lugar.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, description, accent, bg }) => (
              <Card key={title} className="border-border card-hover">
                <CardContent className="p-6 space-y-4">
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon size={20} className={accent} />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-foreground mb-1.5">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section id="como-funciona" className="container py-20 sm:py-24 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-display font-bold">Como funciona</h2>
          <p className="text-muted-foreground">Comece em menos de 2 minutos.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map(({ n, title, desc }) => (
            <div key={n} className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center font-display font-bold text-xl glow-accent">
                {n}
              </div>
              <h3 className="font-heading font-bold text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Intelligence CTA ────────────────────────────────── */}
      <section id="inteligencia" className="bg-secondary/20 border-y border-border py-16">
        <div className="container max-w-4xl">
          <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
            <CardContent className="p-8 sm:p-10 grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-accent text-sm font-medium">
                  <Sparkles size={16} /> Finora Intelligence
                </div>
                <h2 className="text-2xl font-display font-bold leading-tight">
                  IA que categoriza suas transações automaticamente
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Ao importar um CSV, a Finora Intelligence analisa cada descrição e sugere a
                  categoria mais adequada — com indicador de confiança Alta, Média ou Baixa.
                  Você revisa e confirma antes de salvar.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {["Detecta uber, mercado, farmácia e muito mais", "Funciona 100% sem configuração", "Você sempre tem a palavra final"].map((i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                <div className="bg-card border border-border rounded-xl p-4 space-y-3 text-sm">
                  {[
                    { desc: "UBER VIAGEM", cat: "Transporte", conf: "Alta", cls: "text-green-400" },
                    { desc: "IFOOD PEDIDO", cat: "Alimentação", conf: "Alta", cls: "text-green-400" },
                    { desc: "DROGASIL FARM", cat: "Saúde", conf: "Alta", cls: "text-green-400" },
                    { desc: "PIX RECEBIDO", cat: "Receitas", conf: "Média", cls: "text-yellow-400" },
                  ].map(({ desc, cat, conf, cls }) => (
                    <div key={desc} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-xs">{desc}</p>
                        <p className="text-[11px] text-muted-foreground">{cat}</p>
                      </div>
                      <span className={`flex items-center gap-1 text-[11px] font-medium ${cls}`}>
                        <Sparkles size={9} /> {conf}
                      </span>
                    </div>
                  ))}
                </div>
                <Link href="/signup" className={cn(buttonVariants({ size: "sm" }), "w-full gap-1.5")}>
                  Experimentar agora <ArrowRight size={14} />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-border">
        <div className="container py-8 flex flex-col sm:flex-row gap-4 justify-between items-center text-sm text-muted-foreground">
          <FinoraLogo size="sm" />
          <p>© 2026 Finora. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
