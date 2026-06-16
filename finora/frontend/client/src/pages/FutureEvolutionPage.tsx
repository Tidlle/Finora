import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinoraLogo } from "@/components/FinoraLogo";
import { AlertCircle, Upload, FileText, Zap, Bell } from "lucide-react";

export default function FutureEvolutionPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="container flex items-center justify-between h-16">
          <FinoraLogo size="md" />
          <h1 className="text-lg font-heading font-bold text-foreground">Evolução futura</h1>
          <div className="w-8" />
        </div>
      </header>

      <main className="container py-12 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-display font-bold text-foreground">
            Recursos em Desenvolvimento
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Conheça os recursos futuros que estão sendo desenvolvidos para melhorar sua experiência.
          </p>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={24} className="text-accent" />
            <h3 className="text-2xl font-display font-bold text-foreground">Orçamentos mensais</h3>
            <Badge className="ml-auto">Em breve</Badge>
          </div>
          <Card className="border-border">
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-6">
                Defina limites de gasto por categoria e acompanhe seu progresso.
              </p>
              <div className="space-y-4">
                {[
                  { category: "Alimentação", limit: 800, used: 620, status: "OK" },
                  { category: "Lazer", limit: 300, used: 355, status: "Limite ultrapassado" },
                ].map((budget) => (
                  <div key={budget.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{budget.category}</span>
                      <span className={budget.used > budget.limit ? "text-red-400" : "text-green-400"}>
                        {budget.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className={budget.used > budget.limit ? "bg-red-500" : "bg-accent"}
                          style={{ width: `${Math.min((budget.used / budget.limit) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        R$ {budget.used} / R$ {budget.limit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Upload size={24} className="text-accent" />
            <h3 className="text-2xl font-display font-bold text-foreground">Importação de extratos</h3>
            <Badge className="ml-auto">Em breve</Badge>
          </div>
          <Card className="border-border">
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-6">
                Importe suas movimentações bancárias via CSV ou OFX.
              </p>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center space-y-4">
                <Upload size={32} className="mx-auto text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Arraste seu arquivo aqui</p>
                  <p className="text-sm text-muted-foreground">Formatos: CSV, OFX</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <FileText size={24} className="text-accent" />
            <h3 className="text-2xl font-display font-bold text-foreground">Relatórios financeiros</h3>
            <Badge className="ml-auto">Em breve</Badge>
          </div>
          <Card className="border-border">
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-6">
                Gere relatórios detalhados em PDF com análise completa.
              </p>
              <div className="bg-secondary rounded-lg p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-foreground">Período</span>
                  <span className="text-muted-foreground">Maio de 2026</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground">Receitas</span>
                  <span className="text-green-400 font-display font-bold">R$ 5.850,00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground">Despesas</span>
                  <span className="text-red-400 font-display font-bold">R$ 1.569,30</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Zap size={24} className="text-accent" />
            <h3 className="text-2xl font-display font-bold text-foreground">Insights Inteligentes</h3>
            <Badge className="ml-auto">Em breve</Badge>
          </div>
          <Card className="border-border">
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-6">
                Receba análises personalizadas sobre seus hábitos financeiros.
              </p>
              <div className="space-y-4">
                <div className="bg-secondary rounded-lg p-4 space-y-2">
                  <p className="font-medium text-foreground">Você gastou 35% mais com alimentação.</p>
                  <p className="text-sm text-muted-foreground">Abril: R$ 237,40 | Maio: R$ 320,50</p>
                </div>
                <div className="bg-secondary rounded-lg p-4 space-y-2">
                  <p className="font-medium text-foreground">Moradia foi sua maior categoria.</p>
                  <p className="text-sm text-muted-foreground">R$ 950,00 (60,5% do total)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Bell size={24} className="text-accent" />
            <h3 className="text-2xl font-display font-bold text-foreground">Notificações</h3>
            <Badge className="ml-auto">Em breve</Badge>
          </div>
          <Card className="border-border">
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-6">
                Receba alertas sobre seus gastos e metas.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <Bell size={16} className="text-yellow-400" />
                  <span className="text-sm text-foreground">Você atingiu 80% do limite para lazer.</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Bell size={16} className="text-blue-400" />
                  <span className="text-sm text-foreground">Sua meta vence em dezembro.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="text-center space-y-4 py-12">
          <h3 className="text-2xl font-display font-bold text-foreground">
            Fique atento às novidades
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Estes recursos estão em desenvolvimento e serão lançados em breve.
          </p>
        </div>
      </main>

      <footer className="bg-secondary border-t border-border mt-12">
        <div className="container py-8 text-center text-sm text-muted-foreground">
          <p>© 2026 Finora. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

