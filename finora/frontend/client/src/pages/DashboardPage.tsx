import React, { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingDown, TrendingUp, Wallet, Tag, AlertTriangle, CheckCircle, Clock, FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { DashboardDateFilter, type ModoFiltro } from "@/components/DashboardDateFilter";
import { FinancialCard, GoalProgressCard, TransactionItem } from "@/components/FinancialComponents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFinora } from "@/contexts/FinoraContext";
import { formatCurrency, formatDate, monthLabel } from "@/lib/finance";
import {
  classificarAlertasMetas,
  alertasJaExibidos,
  marcarAlertasComoExibidos,
  type AlertaMeta,
} from "@/lib/metaAlertas";
import {
  buscarResumoDashboard,
  type DashboardResumoResponse,
  type FiltrosDashboard,
} from "@/services/dashboardService";
import { listarMetas, type MetaResponse } from "@/services/metaService";
import { listarCategorias, type CategoriaResponse } from "@/services/categoriaService";
import { buscarInsights, type InsightItem, type InsightsResponse } from "@/services/intelligenceService";

const chartColors = ["#FACC15", "#22C55E", "#38BDF8", "#A78BFA", "#FB923C", "#EF4444"];

function mesAtualPadrao() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nomeCurtoDoMes(mes: string) {
  const [ano, numero] = mes.split("-").map(Number);
  return new Date(ano, numero - 1, 1).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

function variacaoLabel(v: number | null | undefined): string | null {
  if (v == null) return null;
  const sinal = v >= 0 ? "+" : "";
  return `${sinal}${v.toFixed(1)}% vs mês anterior`;
}

function gerarRelatorioHTML(dashboard: DashboardResumoResponse, nomeUsuario: string, periodo: string) {
  const linhas = dashboard.ultimasTransacoes
    .map((t) => `<tr>
      <td>${t.dataTransacao}</td><td>${t.descricao}</td><td>${t.categoriaNome}</td>
      <td style="color:${t.tipo === "RECEITA" ? "#16a34a" : "#dc2626"}">${t.tipo === "RECEITA" ? "+" : "-"} R$ ${t.valor.toFixed(2).replace(".", ",")}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><title>Relatório Finora</title>
<style>body{font-family:Arial,sans-serif;color:#111;padding:40px;max-width:800px;margin:0 auto}
h1{color:#111;border-bottom:2px solid #eab308;padding-bottom:8px}
h2{color:#444;font-size:16px;margin-top:24px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:16px 0}
.card{border:1px solid #ddd;padding:16px;border-radius:8px}
.card-label{font-size:12px;color:#666}.card-value{font-size:22px;font-weight:bold;margin-top:4px}
.green{color:#16a34a}.red{color:#dc2626}
table{width:100%;border-collapse:collapse;margin-top:8px;font-size:13px}
th{background:#f5f5f5;padding:8px;text-align:left;border-bottom:2px solid #ddd}
td{padding:7px 8px;border-bottom:1px solid #eee}
.footer{margin-top:40px;font-size:11px;color:#888}</style></head><body>
<h1>Relatório Finora</h1>
<p><strong>Usuário:</strong> ${nomeUsuario}</p>
<p><strong>Período:</strong> ${periodo}</p>
<p><strong>Gerado em:</strong> ${new Date().toLocaleDateString("pt-BR")}</p>
<h2>Resumo financeiro</h2>
<div class="grid">
  <div class="card"><div class="card-label">Saldo</div><div class="card-value">R$ ${dashboard.saldo.toFixed(2).replace(".", ",")}</div></div>
  <div class="card"><div class="card-label">Receitas</div><div class="card-value green">R$ ${dashboard.totalReceitas.toFixed(2).replace(".", ",")}</div></div>
  <div class="card"><div class="card-label">Despesas</div><div class="card-value red">R$ ${dashboard.totalDespesas.toFixed(2).replace(".", ",")}</div></div>
</div>
${dashboard.maiorCategoriaGasto ? `<p><strong>Maior categoria de gasto:</strong> ${dashboard.maiorCategoriaGasto.categoria} — R$ ${dashboard.maiorCategoriaGasto.valor.toFixed(2).replace(".", ",")}</p>` : ""}
<h2>Últimas transações</h2>
<table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th></tr></thead>
<tbody>${linhas || "<tr><td colspan='4' style='color:#888'>Nenhuma transação no período.</td></tr>"}</tbody></table>
<div class="footer">Relatório gerado pelo Finora — finora-kohl.vercel.app</div></body></html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.print();
}

// ── Insights components ──────────────────────────────────────────────────────

const INSIGHT_CONFIG: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  POSITIVO:    { bg: "bg-green-500/8",  border: "border-green-500/20",  text: "text-green-400",  dot: "bg-green-400" },
  ALERTA:      { bg: "bg-yellow-500/8", border: "border-yellow-500/20", text: "text-yellow-400", dot: "bg-yellow-400" },
  NEGATIVO:    { bg: "bg-red-500/8",    border: "border-red-500/20",    text: "text-red-400",    dot: "bg-red-400" },
  INFORMATIVO: { bg: "bg-zinc-800/60",  border: "border-zinc-700",      text: "text-zinc-300",   dot: "bg-zinc-400" },
};

function InsightCard({ item }: { item: InsightItem }) {
  const cfg = INSIGHT_CONFIG[item.tipo] ?? INSIGHT_CONFIG.INFORMATIVO;
  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${cfg.bg} ${cfg.border}`}>
      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
      <div>
        <p className={`text-xs font-semibold ${cfg.text}`}>{item.titulo}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.mensagem}</p>
      </div>
    </div>
  );
}

function InsightsSection({ insights, loading }: { insights: InsightsResponse | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-accent" />
          <span className="text-xs font-semibold text-accent uppercase tracking-wider">Finora Intelligence</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!insights || insights.insights.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles size={13} className="text-accent" />
        <span className="text-xs font-semibold text-accent uppercase tracking-wider">Finora Intelligence</span>
        <span className="text-xs text-muted-foreground">— insights do período</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
        {insights.insights.map((item, i) => (
          <InsightCard key={i} item={item} />
        ))}
      </div>
    </div>
  );
}

// ── Chart helper components ─────────────────────────────────────────────────

function BarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const receitas = payload.find((p) => p.name === "Receitas")?.value ?? 0;
  const despesas = payload.find((p) => p.name === "Despesas")?.value ?? 0;
  const saldo = receitas - despesas;
  return (
    <div className="rounded-xl border border-border bg-card px-3.5 py-3 text-xs shadow-xl space-y-1.5" style={{ minWidth: 160 }}>
      <p className="font-semibold text-foreground mb-2">{label}</p>
      <div className="flex justify-between gap-6"><span className="text-green-400">Receitas</span><span className="tabular-nums font-medium">{formatCurrency(receitas)}</span></div>
      <div className="flex justify-between gap-6"><span className="text-red-400">Despesas</span><span className="tabular-nums font-medium">{formatCurrency(despesas)}</span></div>
      <div className={`flex justify-between gap-6 border-t border-border pt-1.5 ${saldo >= 0 ? "text-green-400" : "text-red-400"}`}>
        <span>Saldo</span>
        <span className="tabular-nums font-bold">{saldo >= 0 ? "+" : ""}{formatCurrency(saldo)}</span>
      </div>
    </div>
  );
}

function PieTooltip({ active, payload, total }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }>; total: number }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
  return (
    <div className="rounded-xl border border-border bg-card px-3.5 py-3 text-xs shadow-xl space-y-1" style={{ minWidth: 160 }}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.payload.color }} />
        <span className="font-semibold text-foreground">{item.name}</span>
      </div>
      <div className="flex justify-between gap-6"><span className="text-muted-foreground">Valor</span><span className="tabular-nums font-medium">{formatCurrency(item.value)}</span></div>
      <div className="flex justify-between gap-6"><span className="text-muted-foreground">% do total</span><span className="tabular-nums font-medium">{pct}%</span></div>
    </div>
  );
}

function BarChartLegend({ melhorMes }: { melhorMes: { month: string; income: number; expense: number } | null | undefined }) {
  return (
    <div className="flex items-center justify-between mt-3 text-xs flex-wrap gap-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-500" /><span className="text-muted-foreground">Receitas</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" /><span className="text-muted-foreground">Despesas</span></div>
      </div>
      {melhorMes && (
        <span className="text-muted-foreground">
          Melhor mês: <span className="text-green-400 font-medium">{melhorMes.month}</span>
          {" · "}saldo <span className="text-green-400 font-medium">{formatCurrency(melhorMes.income - melhorMes.expense)}</span>
        </span>
      )}
    </div>
  );
}

function ChartEmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="h-[240px] flex flex-col items-center justify-center gap-3 text-muted-foreground">
      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5">
        {icon}
      </div>
      <p className="text-sm text-center max-w-xs">{message}</p>
    </div>
  );
}

function AreaTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const receitas = payload.find((p) => p.name === "Receitas")?.value ?? 0;
  const despesas = payload.find((p) => p.name === "Despesas")?.value ?? 0;
  const saldo = receitas - despesas;
  return (
    <div className="rounded-xl border border-[#FACC15]/20 bg-[#111111] px-4 py-3 text-xs shadow-2xl space-y-1.5" style={{ minWidth: 170 }}>
      <p className="font-semibold text-white mb-2 text-[11px] uppercase tracking-wider">{label}</p>
      <div className="flex justify-between gap-6">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />Receitas</span>
        <span className="tabular-nums font-medium text-green-400">{formatCurrency(receitas)}</span>
      </div>
      <div className="flex justify-between gap-6">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Despesas</span>
        <span className="tabular-nums font-medium text-red-400">{formatCurrency(despesas)}</span>
      </div>
      <div className={`flex justify-between gap-6 border-t border-white/10 pt-1.5 ${saldo >= 0 ? "text-[#FACC15]" : "text-red-400"}`}>
        <span className="font-medium">Saldo</span>
        <span className="tabular-nums font-bold">{saldo >= 0 ? "+" : ""}{formatCurrency(saldo)}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { currentUser } = useFinora();
  const [modoFiltro, setModoFiltro] = useState<ModoFiltro>("mes");
  const [selectedMonth, setSelectedMonth] = useState(mesAtualPadrao());
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | undefined>(undefined);
  const [categorias, setCategorias] = useState<CategoriaResponse[]>([]);
  const [dashboard, setDashboard] = useState<DashboardResumoResponse | null>(null);
  const [goals, setGoals] = useState<MetaResponse[]>([]);
  const [alertas, setAlertas] = useState<AlertaMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState<"bar" | "area">("bar");
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const filtros = useMemo((): FiltrosDashboard => {
    if (modoFiltro === "periodo" && dataInicial && dataFinal)
      return { dataInicial, dataFinal, categoriaId: categoriaFiltro };
    return { mes: selectedMonth, categoriaId: categoriaFiltro };
  }, [modoFiltro, selectedMonth, dataInicial, dataFinal, categoriaFiltro]);

  useEffect(() => {
    listarCategorias().then(setCategorias).catch(() => {});
  }, []);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        setLoading(true);
        const [resumo, metas] = await Promise.all([buscarResumoDashboard(filtros), listarMetas()]);
        if (!ativo) return;
        setDashboard(resumo);
        setGoals(metas.filter((m) => m.status === "EM_ANDAMENTO"));
        const alertasCalc = classificarAlertasMetas(metas);
        setAlertas(alertasCalc);
        if (!alertasJaExibidos() && alertasCalc.length > 0) {
          marcarAlertasComoExibidos();
          alertasCalc.slice(0, 3).forEach((a) => {
            if (a.tipo === "concluida") toast.success(a.mensagem);
            else if (a.tipo === "vencida") toast.error(a.mensagem);
            else toast.warning(a.mensagem);
          });
          if (alertasCalc.length > 3) toast.info(`+${alertasCalc.length - 3} alerta(s) de meta.`);
        }
      } catch (err) {
        if (!ativo) return;
        toast.error(err instanceof Error ? err.message : "Erro ao carregar dashboard.");
      } finally {
        if (ativo) setLoading(false);
      }
    }
    carregar();
    return () => { ativo = false; };
  }, [filtros]);

  useEffect(() => {
    let ativo = true;
    setInsightsLoading(true);
    const params = filtros.mes
      ? { mes: filtros.mes }
      : { dataInicial: filtros.dataInicial, dataFinal: filtros.dataFinal };
    buscarInsights(params)
      .then((r) => { if (ativo) setInsights(r); })
      .catch(() => { if (ativo) setInsights(null); })
      .finally(() => { if (ativo) setInsightsLoading(false); });
    return () => { ativo = false; };
  }, [filtros]);

  const categoryData = useMemo(
    () => dashboard?.gastosPorCategoria.map((item, i) => ({
      name: item.categoria, value: item.valor, color: chartColors[i % chartColors.length],
    })) ?? [],
    [dashboard]
  );

  const revenueData = useMemo(
    () => dashboard?.evolucaoMensal.map((item) => ({
      month: nomeCurtoDoMes(item.mes), income: item.receitas, expense: item.despesas,
    })) ?? [],
    [dashboard]
  );

  const firstName = currentUser?.fullName.split(" ")[0] ?? "Usuário";
  const topCategory = dashboard?.maiorCategoriaGasto;
  const periodoLabel = modoFiltro === "mes"
    ? monthLabel(selectedMonth)
    : dataInicial && dataFinal ? `${dataInicial} a ${dataFinal}` : "Selecione um período";

  const alertasUrgentes = alertas.filter((a) => a.tipo === "vencida" || a.tipo === "prazoProximo");
  const alertasPositivos = alertas.filter((a) => a.tipo === "concluida" || a.tipo === "quaseConcluida");

  const totalDespesasCategoria = useMemo(
    () => categoryData.reduce((s, d) => s + d.value, 0),
    [categoryData]
  );

  const melhorMes = useMemo(() => {
    if (!revenueData.length) return null;
    return revenueData.reduce((best, d) =>
      (d.income - d.expense) > (best.income - best.expense) ? d : best
    );
  }, [revenueData]);

  return (
    <AppShell title={`Olá, ${firstName}`} subtitle="Aqui está o resumo das suas finanças." contentClassName="!space-y-4">

      {/* ── Alertas ────────────────────────────────────────── */}
      {(alertasUrgentes.length > 0 || alertasPositivos.length > 0) && (
        <div className="space-y-2">
          {alertasUrgentes.map((a) => (
            <div key={a.meta.id} className={`flex items-center gap-3 p-3.5 rounded-xl text-sm border font-medium ${
              a.tipo === "vencida"
                ? "bg-red-500/8 border-red-500/20 text-red-400"
                : "bg-yellow-500/8 border-yellow-500/20 text-yellow-400"
            }`}>
              {a.tipo === "vencida" ? <AlertTriangle size={15} /> : <Clock size={15} />}
              {a.mensagem}
            </div>
          ))}
          {alertasPositivos.map((a) => (
            <div key={a.meta.id} className={`flex items-center gap-3 p-3.5 rounded-xl text-sm border font-medium ${
              a.tipo === "concluida"
                ? "bg-green-500/8 border-green-500/20 text-green-400"
                : "bg-blue-500/8 border-blue-500/20 text-blue-400"
            }`}>
              <CheckCircle size={15} />
              {a.mensagem}
            </div>
          ))}
        </div>
      )}

      {/* ── Filtros ────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-start gap-3">
          <DashboardDateFilter
            modoFiltro={modoFiltro}
            onModoChange={setModoFiltro}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            dataInicial={dataInicial}
            dataFinal={dataFinal}
            onDataInicialChange={setDataInicial}
            onDataFinalChange={setDataFinal}
          />

          <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
            <select
              value={categoriaFiltro ?? ""}
              onChange={(e) => setCategoriaFiltro(e.target.value ? Number(e.target.value) : undefined)}
              className="h-9 rounded-lg border border-[#27272A] bg-transparent px-3 text-sm text-foreground"
            >
              <option value="" className="bg-card">Todas as categorias</option>
              {categorias.map((c) => <option key={c.id} value={c.id} className="bg-card">{c.nome}</option>)}
            </select>

            <Button variant="outline" size="sm" onClick={() => dashboard && gerarRelatorioHTML(dashboard, currentUser?.fullName ?? "Usuário", periodoLabel)} disabled={!dashboard}>
              <FileText size={14} /> Exportar PDF
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground capitalize">
          <Sparkles size={11} className="text-accent" />
          {periodoLabel}
          {categoriaFiltro && (
            <Badge variant="secondary" className="text-xs ml-1">
              {categorias.find((c) => c.id === categoriaFiltro)?.nome}
            </Badge>
          )}
        </div>
      </div>

      {/* ── Loading ────────────────────────────────────────── */}
      {loading ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {[0, 1].map((i) => (
              <Card key={i} className="border-border">
                <CardHeader><Skeleton className="h-5 w-44" /></CardHeader>
                <CardContent><Skeleton className="h-[280px] w-full" /></CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* ── Metric cards ─────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <FinancialCard
              title="Saldo do período"
              value={formatCurrency(dashboard?.saldo ?? 0)}
              subtitle="Receitas menos despesas"
              icon={<Wallet size={18} />}
            />
            <FinancialCard
              title="Receitas"
              value={formatCurrency(dashboard?.totalReceitas ?? 0)}
              subtitle={variacaoLabel(dashboard?.variacaoReceitas) ?? "Entradas do período"}
              variant="income"
              icon={<TrendingUp size={18} />}
            />
            <FinancialCard
              title="Despesas"
              value={formatCurrency(dashboard?.totalDespesas ?? 0)}
              subtitle={variacaoLabel(dashboard?.variacaoDespesas) ?? "Saídas do período"}
              variant="expense"
              icon={<TrendingDown size={18} />}
            />
            <FinancialCard
              title="Maior categoria"
              value={formatCurrency(topCategory?.valor ?? 0)}
              subtitle={topCategory?.categoria ?? "Nenhuma despesa"}
              icon={<Tag size={18} />}
            />
          </div>

          {/* ── Insights ─────────────────────────────────────── */}
          <InsightsSection insights={insights} loading={insightsLoading} />

          {/* ── Charts ───────────────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

            {/* Receitas vs Despesas */}
            <Card className="border-border">
              <CardHeader className="pb-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <CardTitle className="text-base">
                      {chartView === "bar" ? "Receitas vs Despesas" : "Evolução financeira"}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {chartView === "bar"
                        ? "Evolução mensal de entradas e saídas"
                        : "Receitas e despesas ao longo do período selecionado"}
                    </p>
                  </div>
                  {/* Toggle */}
                  <div className="flex rounded-lg border border-border overflow-hidden text-xs shrink-0">
                    <button
                      onClick={() => setChartView("bar")}
                      className={`px-3 py-1.5 font-medium transition-colors ${chartView === "bar" ? "bg-accent text-black" : "text-muted-foreground hover:bg-secondary"}`}
                    >
                      Barras
                    </button>
                    <button
                      onClick={() => setChartView("area")}
                      className={`px-3 py-1.5 font-medium border-l border-border transition-colors ${chartView === "area" ? "bg-accent text-black" : "text-muted-foreground hover:bg-secondary"}`}
                    >
                      Evolução
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {revenueData.every((d) => d.income === 0 && d.expense === 0) ? (
                  <ChartEmptyState icon={<BarChart3Icon />} message="Nenhuma movimentação no período selecionado." />
                ) : chartView === "bar" ? (
                  <>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={revenueData} barGap={3} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" vertical={false} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#52525B", fontSize: 11, fontFamily: "Inter" }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#52525B", fontSize: 11, fontFamily: "Inter" }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                        <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                        <Bar dataKey="income" fill="#22C55E" name="Receitas" radius={[4, 4, 0, 0]} maxBarSize={28} />
                        <Bar dataKey="expense" fill="#EF4444" name="Despesas" radius={[4, 4, 0, 0]} maxBarSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                    <BarChartLegend melhorMes={melhorMes} />
                  </>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={240}>
                      <AreaChart data={revenueData} margin={{ top: 8, right: 4, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gradReceitas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gradDespesas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" vertical={false} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#52525B", fontSize: 11, fontFamily: "Inter" }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#52525B", fontSize: 11, fontFamily: "Inter" }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                        <Tooltip content={<AreaTooltip />} cursor={{ stroke: "#FACC15", strokeWidth: 1, strokeDasharray: "4 4" }} />
                        <Area type="monotone" dataKey="income" name="Receitas" stroke="#22C55E" strokeWidth={2.5} fill="url(#gradReceitas)" dot={false} activeDot={{ r: 4, fill: "#22C55E", stroke: "#111", strokeWidth: 2 }} />
                        <Area type="monotone" dataKey="expense" name="Despesas" stroke="#EF4444" strokeWidth={2.5} fill="url(#gradDespesas)" dot={false} activeDot={{ r: 4, fill: "#EF4444", stroke: "#111", strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div className="flex items-center justify-between mt-3 text-xs flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-green-400 inline-block rounded-full" /><span className="text-muted-foreground">Receitas</span></div>
                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-red-400 inline-block rounded-full" /><span className="text-muted-foreground">Despesas</span></div>
                      </div>
                      {melhorMes && (
                        <span className="text-muted-foreground">
                          Melhor mês: <span className="text-[#FACC15] font-medium">{melhorMes.month}</span>
                          {" · "}saldo <span className="text-[#FACC15] font-medium">{formatCurrency(melhorMes.income - melhorMes.expense)}</span>
                        </span>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Despesas por categoria (donut) */}
            <Card className="border-border">
              <CardHeader className="pb-0">
                <CardTitle className="text-base">Despesas por categoria</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Distribuição das saídas no período selecionado</p>
              </CardHeader>
              <CardContent className="pt-4">
                {categoryData.length === 0 ? (
                  <ChartEmptyState icon={<PieIcon />} message="Nenhuma despesa registrada no período." />
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="shrink-0 w-full sm:w-48">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={58}
                            outerRadius={88}
                            paddingAngle={2}
                            dataKey="value"
                            nameKey="name"
                            strokeWidth={0}
                          >
                            {categoryData.map((e) => <Cell key={e.name} fill={e.color} />)}
                            <Label
                              content={({ viewBox }) => {
                                const { cx, cy } = viewBox as { cx: number; cy: number };
                                return (
                                  <g>
                                    <text x={cx} y={cy - 9} textAnchor="middle" fill="#71717A" fontSize={9} fontFamily="Inter">
                                      Total gasto
                                    </text>
                                    <text x={cx} y={cy + 10} textAnchor="middle" fill="#F9FAFB" fontSize={12} fontWeight="700" fontFamily="Inter">
                                      {formatCurrency(totalDespesasCategoria)}
                                    </text>
                                  </g>
                                );
                              }}
                              position="center"
                            />
                          </Pie>
                          <Tooltip content={<PieTooltip total={totalDespesasCategoria} />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      {categoryData.slice(0, 6).map((item) => {
                        const pct = totalDespesasCategoria > 0
                          ? ((item.value / totalDespesasCategoria) * 100).toFixed(0)
                          : "0";
                        return (
                          <div key={item.name} className="space-y-1">
                            <div className="flex items-center justify-between text-xs gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                <span className="text-muted-foreground truncate">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-muted-foreground">{pct}%</span>
                                <span className="font-medium text-foreground tabular-nums">{formatCurrency(item.value)}</span>
                              </div>
                            </div>
                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, backgroundColor: item.color }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Recent + Goals ───────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card className="border-border">
              <CardHeader className="pb-0">
                <CardTitle className="text-base">Últimas transações</CardTitle>
              </CardHeader>
              <CardContent className="p-0 mt-2">
                {!dashboard || dashboard.ultimasTransacoes.length === 0 ? (
                  <p className="px-5 py-8 text-sm text-muted-foreground text-center">Nenhuma transação neste período.</p>
                ) : dashboard.ultimasTransacoes.map((t) => (
                  <TransactionItem
                    key={t.id}
                    date={formatDate(t.dataTransacao)}
                    description={t.descricao}
                    category={t.categoriaNome}
                    type={t.tipo === "RECEITA" ? "income" : "expense"}
                    amount={t.valor}
                  />
                ))}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Metas em andamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {goals.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Crie sua primeira meta para acompanhar seu progresso.
                  </p>
                ) : goals.slice(0, 2).map((goal) => (
                  <GoalProgressCard
                    key={goal.id}
                    title={goal.nome}
                    description={goal.descricao ?? undefined}
                    current={goal.valorAcumulado}
                    target={goal.valorObjetivo}
                    deadline={goal.prazo ? formatDate(goal.prazo) : undefined}
                    status={goal.status === "CONCLUIDA" ? "completed" : "in-progress"}
                  />
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </AppShell>
  );
}

function BarChart3Icon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-30">
      <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
    </svg>
  );
}

function PieIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-30">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}
