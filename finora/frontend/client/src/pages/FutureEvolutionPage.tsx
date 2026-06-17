import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Wallet, AlertTriangle, CheckCircle, BarChart3 } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { FinancialCard } from "@/components/FinancialComponents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/finance";
import { buscarProjecao, type DashboardProjecaoResponse } from "@/services/dashboardService";

function nomeCurtoDoMes(mes: string) {
  const [ano, numero] = mes.split("-").map(Number);
  return new Date(ano, numero - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

export default function FutureEvolutionPage() {
  const [projecao, setProjecao] = useState<DashboardProjecaoResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buscarProjecao()
      .then(setProjecao)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao carregar projeções."))
      .finally(() => setLoading(false));
  }, []);

  const chartData = projecao?.projecoes.map((p) => ({
    mes: nomeCurtoDoMes(p.mes),
    saldo: p.saldoProjetado,
  })) ?? [];

  const tendenciaPositiva = (projecao?.economiaMedia ?? 0) >= 0;

  return (
    <AppShell title="Projeções financeiras" subtitle="Visualize tendências e previsões baseadas no seu histórico.">
      {loading ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-border">
                <CardContent className="p-6 space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-3 w-40" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="border-border">
            <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
            <CardContent><Skeleton className="h-[280px] w-full" /></CardContent>
          </Card>
        </>
      ) : projecao?.dadosInsuficientes ? (
        <Card className="border-border">
          <CardContent className="p-12 text-center">
            <BarChart3 size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">Dados insuficientes</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {projecao.alertas[0] ?? "Cadastre mais transações para ver suas projeções financeiras."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <FinancialCard
              title="Saldo atual estimado"
              value={formatCurrency(projecao?.saldoEstimadoAtual ?? 0)}
              subtitle="Com base em todo o histórico"
              icon={<Wallet size={22} />}
            />
            <FinancialCard
              title="Média de receitas"
              value={formatCurrency(projecao?.mediaReceitas ?? 0)}
              subtitle="Média mensal (últimos 6 meses)"
              variant="income"
              icon={<TrendingUp size={22} />}
            />
            <FinancialCard
              title="Média de despesas"
              value={formatCurrency(projecao?.mediaDespesas ?? 0)}
              subtitle="Média mensal (últimos 6 meses)"
              variant="expense"
              icon={<TrendingDown size={22} />}
            />
            <FinancialCard
              title="Economia mensal"
              value={formatCurrency(Math.abs(projecao?.economiaMedia ?? 0))}
              subtitle={tendenciaPositiva ? "Você está poupando" : "Déficit mensal"}
              variant={tendenciaPositiva ? "income" : "expense"}
              icon={tendenciaPositiva ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
            />
          </div>

          {projecao?.maiorCategoriaGasto && (
            <Card className="border-border bg-secondary/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <BarChart3 size={20} className="text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Maior categoria de gasto</p>
                  <p className="text-xs text-muted-foreground">{projecao.maiorCategoriaGasto} representa a maior parte das suas despesas.</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Projeção de saldo — próximos 6 meses</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                  Dados insuficientes para gerar o gráfico.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={tendenciaPositiva ? "#22C55E" : "#EF4444"} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={tendenciaPositiva ? "#22C55E" : "#EF4444"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                    <XAxis dataKey="mes" stroke="#A1A1AA" />
                    <YAxis stroke="#A1A1AA" />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value)), "Saldo projetado"]}
                      contentStyle={{ backgroundColor: "#171717", border: "1px solid #2A2A2A", borderRadius: "8px" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="saldo"
                      stroke={tendenciaPositiva ? "#22C55E" : "#EF4444"}
                      fill="url(#saldoGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {projecao && projecao.alertas.length > 0 && (
            <Card className="border-border">
              <CardHeader><CardTitle>Análise e sugestões</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {projecao.alertas.map((alerta, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${
                      alerta.toLowerCase().includes("atenção") || alerta.toLowerCase().includes("maior") || alerta.toLowerCase().includes("despesa")
                        ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-300"
                        : "bg-green-500/10 border-green-500/30 text-green-300"
                    }`}
                  >
                    {alerta.toLowerCase().includes("atenção") ? (
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle size={16} className="shrink-0 mt-0.5" />
                    )}
                    {alerta}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </AppShell>
  );
}
