import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Wallet, AlertTriangle, CheckCircle, BarChart3, Sparkles } from "lucide-react";
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
  const lineColor = tendenciaPositiva ? "#22C55E" : "#EF4444";

  const tooltipStyle = {
    backgroundColor: "#171717",
    border: "1px solid #2A2A2A",
    borderRadius: "8px",
    fontSize: "12px",
  };

  return (
    <AppShell title="Projeções financeiras" subtitle="Tendências e previsões baseadas no seu histórico.">

      {/* ── Intelligence badge ──────────────────────────────── */}
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-accent/8 border border-accent/15 w-fit text-sm text-accent font-medium">
        <Sparkles size={14} />
        Finora Intelligence — projeções baseadas nos últimos 6 meses
      </div>

      {loading ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-border">
                <CardContent className="p-5 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                  <Skeleton className="h-7 w-28" />
                  <Skeleton className="h-3 w-32" />
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
          <CardContent className="p-16 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
              <BarChart3 size={26} className="text-muted-foreground" />
            </div>
            <div>
              <p className="font-heading font-bold text-lg">Dados insuficientes</p>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
                {projecao.alertas[0] ?? "Cadastre mais transações para que o Finora calcule sua evolução financeira futura."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Metric cards ─────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <FinancialCard
              title="Saldo atual estimado"
              value={formatCurrency(projecao?.saldoEstimadoAtual ?? 0)}
              subtitle="Com base em todo o histórico"
              icon={<Wallet size={18} />}
            />
            <FinancialCard
              title="Média de receitas"
              value={formatCurrency(projecao?.mediaReceitas ?? 0)}
              subtitle="Média mensal (últimos 6 meses)"
              variant="income"
              icon={<TrendingUp size={18} />}
            />
            <FinancialCard
              title="Média de despesas"
              value={formatCurrency(projecao?.mediaDespesas ?? 0)}
              subtitle="Média mensal (últimos 6 meses)"
              variant="expense"
              icon={<TrendingDown size={18} />}
            />
            <FinancialCard
              title="Economia mensal"
              value={formatCurrency(Math.abs(projecao?.economiaMedia ?? 0))}
              subtitle={tendenciaPositiva ? "Você está poupando" : "Déficit mensal"}
              variant={tendenciaPositiva ? "income" : "expense"}
              icon={tendenciaPositiva ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            />
          </div>

          {/* ── Top category insight ─────────────────────────── */}
          {projecao?.maiorCategoriaGasto && (
            <Card className="border-border border-accent/15">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent/10 shrink-0">
                  <BarChart3 size={18} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium">Maior categoria de gasto</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="text-accent font-medium">{projecao.maiorCategoriaGasto}</span> representa a maior parte das suas despesas históricas.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Chart ────────────────────────────────────────── */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">Projeção de saldo — próximos 6 meses</CardTitle>
                <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                  tendenciaPositiva ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                }`}>
                  {tendenciaPositiva ? "↑ Tendência positiva" : "↓ Tendência negativa"}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                  Dados insuficientes para gerar o gráfico.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={lineColor} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" />
                    <XAxis dataKey="mes" stroke="#52525B" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#52525B" tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(v) => [formatCurrency(Number(v)), "Saldo projetado"]}
                      contentStyle={tooltipStyle}
                    />
                    <Area
                      type="monotone"
                      dataKey="saldo"
                      stroke={lineColor}
                      fill="url(#saldoGradient)"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* ── Insights ─────────────────────────────────────── */}
          {projecao && projecao.alertas.length > 0 && (
            <Card className="border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-accent" />
                  <CardTitle className="text-base">Análise e sugestões</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {projecao.alertas.map((alerta, i) => {
                  const isWarning = alerta.toLowerCase().includes("atenção") || alerta.toLowerCase().includes("maior") || alerta.toLowerCase().includes("despesa");
                  return (
                    <div key={i} className={`flex items-start gap-3 p-3.5 rounded-xl border text-sm ${
                      isWarning
                        ? "bg-yellow-500/8 border-yellow-500/20 text-yellow-300"
                        : "bg-green-500/8 border-green-500/20 text-green-300"
                    }`}>
                      {isWarning
                        ? <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                        : <CheckCircle size={15} className="shrink-0 mt-0.5" />}
                      {alerta}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </AppShell>
  );
}
