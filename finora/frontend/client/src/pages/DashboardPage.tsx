import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingDown, TrendingUp, Wallet, Tag, AlertTriangle, CheckCircle, Clock, FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { FinancialCard, GoalProgressCard, TransactionItem } from "@/components/FinancialComponents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

const chartColors = ["#FACC15", "#22C55E", "#38BDF8", "#A78BFA", "#FB923C", "#EF4444"];

type ModoFiltro = "mes" | "periodo";

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

  const tooltipStyle = { backgroundColor: "#171717", border: "1px solid #2A2A2A", borderRadius: "8px", fontSize: "12px" };

  return (
    <AppShell title={`Olá, ${firstName} 👋`} subtitle="Aqui está o resumo das suas finanças.">

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
      <Card className="border-border">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg border border-border overflow-hidden text-sm">
              <button
                className={`px-3.5 py-2 text-sm font-medium transition-colors ${modoFiltro === "mes" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary"}`}
                onClick={() => setModoFiltro("mes")}
              >Por mês</button>
              <button
                className={`px-3.5 py-2 text-sm font-medium border-l border-border transition-colors ${modoFiltro === "periodo" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary"}`}
                onClick={() => setModoFiltro("periodo")}
              >Período</button>
            </div>

            {modoFiltro === "mes" ? (
              <Input type="month" aria-label="Mês" value={selectedMonth} onChange={(e) => e.target.value && setSelectedMonth(e.target.value)} className="w-44" />
            ) : (
              <div className="flex gap-2 flex-wrap items-center">
                <Input type="date" aria-label="Data inicial" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} className="w-40" />
                <span className="text-muted-foreground text-sm">até</span>
                <Input type="date" aria-label="Data final" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} className="w-40" />
              </div>
            )}

            <select
              value={categoriaFiltro ?? ""}
              onChange={(e) => setCategoriaFiltro(e.target.value ? Number(e.target.value) : undefined)}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm text-foreground"
            >
              <option value="" className="bg-card">Todas as categorias</option>
              {categorias.map((c) => <option key={c.id} value={c.id} className="bg-card">{c.nome}</option>)}
            </select>

            <Button variant="outline" size="sm" onClick={() => dashboard && gerarRelatorioHTML(dashboard, currentUser?.fullName ?? "Usuário", periodoLabel)} disabled={!dashboard}>
              <FileText size={14} /> Exportar PDF
            </Button>
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
        </CardContent>
      </Card>

      {/* ── Loading ────────────────────────────────────────── */}
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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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

          {/* ── Charts ───────────────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Receitas vs Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                {revenueData.every((d) => d.income === 0 && d.expense === 0) ? (
                  <div className="h-[260px] flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                    <BarChart3Icon />
                    Nenhuma movimentação no período selecionado.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={revenueData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" />
                      <XAxis dataKey="month" stroke="#52525B" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#52525B" tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="income" fill="#22C55E" name="Receitas" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="expense" fill="#EF4444" name="Despesas" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Despesas por categoria</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryData.length === 0 ? (
                  <div className="h-[260px] flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                    <PieIcon />
                    Nenhuma despesa registrada no período.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="45%" outerRadius={88} innerRadius={36} dataKey="value" nameKey="name">
                        {categoryData.map((e) => <Cell key={e.name} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Recent + Goals ───────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
