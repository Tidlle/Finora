import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingDown, TrendingUp, Wallet, Tag, AlertTriangle, CheckCircle, Clock, FileText } from "lucide-react";
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

const chartColors = ["#FACC15", "#38BDF8", "#EF4444", "#22C55E", "#A78BFA", "#FB923C"];

type ModoFiltro = "mes" | "periodo";

function mesAtualPadrao() {
  const data = new Date();
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
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

function gerarRelatorioHTML(
  dashboard: DashboardResumoResponse,
  nomeUsuario: string,
  periodo: string
): void {
  const linhasTransacoes = dashboard.ultimasTransacoes
    .map(
      (t) =>
        `<tr>
          <td>${t.dataTransacao}</td>
          <td>${t.descricao}</td>
          <td>${t.categoriaNome}</td>
          <td style="color:${t.tipo === "RECEITA" ? "#16a34a" : "#dc2626"}">${t.tipo === "RECEITA" ? "+" : "-"} R$ ${t.valor.toFixed(2).replace(".", ",")}</td>
        </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Relatório Finora</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { color: #111; border-bottom: 2px solid #eab308; padding-bottom: 8px; }
    h2 { color: #444; font-size: 16px; margin-top: 24px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 16px 0; }
    .card { border: 1px solid #ddd; padding: 16px; border-radius: 8px; }
    .card-label { font-size: 12px; color: #666; }
    .card-value { font-size: 22px; font-weight: bold; margin-top: 4px; }
    .green { color: #16a34a; } .red { color: #dc2626; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
    th { background: #f5f5f5; padding: 8px; text-align: left; border-bottom: 2px solid #ddd; }
    td { padding: 7px 8px; border-bottom: 1px solid #eee; }
    .footer { margin-top: 40px; font-size: 11px; color: #888; }
  </style>
</head>
<body>
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
  <table>
    <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th></tr></thead>
    <tbody>${linhasTransacoes || "<tr><td colspan='4' style='color:#888'>Nenhuma transação no período.</td></tr>"}</tbody>
  </table>

  <div class="footer">Relatório gerado pelo Finora — finora-kohl.vercel.app</div>
</body>
</html>`;

  const janela = window.open("", "_blank");
  if (!janela) return;
  janela.document.write(html);
  janela.document.close();
  janela.print();
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
    if (modoFiltro === "periodo" && dataInicial && dataFinal) {
      return { dataInicial, dataFinal, categoriaId: categoriaFiltro };
    }
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
        const [resumo, metas] = await Promise.all([
          buscarResumoDashboard(filtros),
          listarMetas(),
        ]);

        if (!ativo) return;

        setDashboard(resumo);
        setGoals(metas.filter((m) => m.status === "EM_ANDAMENTO"));

        const alertasCalculados = classificarAlertasMetas(metas);
        setAlertas(alertasCalculados);

        if (!alertasJaExibidos() && alertasCalculados.length > 0) {
          marcarAlertasComoExibidos();
          alertasCalculados.slice(0, 3).forEach((a) => {
            if (a.tipo === "concluida") toast.success(a.mensagem);
            else if (a.tipo === "vencida") toast.error(a.mensagem);
            else toast.warning(a.mensagem);
          });
          if (alertasCalculados.length > 3) {
            toast.info(`+${alertasCalculados.length - 3} alerta(s) de meta. Veja em Metas.`);
          }
        }
      } catch (error) {
        if (!ativo) return;
        toast.error(error instanceof Error ? error.message : "Erro ao carregar dashboard.");
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregar();
    return () => { ativo = false; };
  }, [filtros]);

  const categoryData = useMemo(
    () => dashboard?.gastosPorCategoria.map((item, i) => ({
      name: item.categoria,
      value: item.valor,
      color: chartColors[i % chartColors.length],
    })) ?? [],
    [dashboard]
  );

  const revenueData = useMemo(
    () => dashboard?.evolucaoMensal.map((item) => ({
      month: nomeCurtoDoMes(item.mes),
      income: item.receitas,
      expense: item.despesas,
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

  function handleExportarPDF() {
    if (!dashboard) return;
    gerarRelatorioHTML(dashboard, currentUser?.fullName ?? "Usuário", periodoLabel);
  }

  return (
    <AppShell title={`Olá, ${firstName}`} subtitle="Aqui está o resumo das suas finanças.">

      {/* Alertas de metas */}
      {(alertasUrgentes.length > 0 || alertasPositivos.length > 0) && (
        <div className="space-y-2">
          {alertasUrgentes.map((a) => (
            <div key={a.meta.id} className={`flex items-center gap-3 p-3 rounded-lg text-sm border ${
              a.tipo === "vencida"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
            }`}>
              {a.tipo === "vencida" ? <AlertTriangle size={16} /> : <Clock size={16} />}
              {a.mensagem}
            </div>
          ))}
          {alertasPositivos.map((a) => (
            <div key={a.meta.id} className={`flex items-center gap-3 p-3 rounded-lg text-sm border ${
              a.tipo === "concluida"
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-blue-500/10 border-blue-500/30 text-blue-400"
            }`}>
              <CheckCircle size={16} />
              {a.mensagem}
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg border border-border overflow-hidden text-sm">
              <button
                className={`px-3 py-1.5 ${modoFiltro === "mes" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary"}`}
                onClick={() => setModoFiltro("mes")}
              >
                Por mês
              </button>
              <button
                className={`px-3 py-1.5 border-l border-border ${modoFiltro === "periodo" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary"}`}
                onClick={() => setModoFiltro("periodo")}
              >
                Período personalizado
              </button>
            </div>

            {modoFiltro === "mes" ? (
              <Input
                aria-label="Selecionar mês"
                type="month"
                value={selectedMonth}
                onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
                className="w-44"
              />
            ) : (
              <div className="flex gap-2 flex-wrap">
                <Input
                  type="date"
                  aria-label="Data inicial"
                  value={dataInicial}
                  onChange={(e) => setDataInicial(e.target.value)}
                  className="w-40"
                />
                <span className="self-center text-muted-foreground text-sm">até</span>
                <Input
                  type="date"
                  aria-label="Data final"
                  value={dataFinal}
                  onChange={(e) => setDataFinal(e.target.value)}
                  className="w-40"
                />
              </div>
            )}

            <select
              value={categoriaFiltro ?? ""}
              onChange={(e) => setCategoriaFiltro(e.target.value ? Number(e.target.value) : undefined)}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm text-foreground"
            >
              <option value="" className="bg-card">Todas as categorias</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id} className="bg-card">{c.nome}</option>
              ))}
            </select>

            <Button variant="outline" size="sm" onClick={handleExportarPDF} disabled={!dashboard}>
              <FileText size={15} /> Exportar PDF
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground capitalize">{periodoLabel}</p>
            {categoriaFiltro && (
              <Badge variant="secondary" className="text-xs">
                Categoria: {categorias.find((c) => c.id === categoriaFiltro)?.nome}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="border-border">
                <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
                <CardContent><Skeleton className="h-[280px] w-full" /></CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <FinancialCard
              title="Saldo"
              value={formatCurrency(dashboard?.saldo ?? 0)}
              subtitle="Receitas menos despesas"
              icon={<Wallet size={22} />}
            />
            <FinancialCard
              title="Receitas"
              value={formatCurrency(dashboard?.totalReceitas ?? 0)}
              subtitle={variacaoLabel(dashboard?.variacaoReceitas) ?? "Entradas do período"}
              variant="income"
              icon={<TrendingUp size={22} />}
            />
            <FinancialCard
              title="Despesas"
              value={formatCurrency(dashboard?.totalDespesas ?? 0)}
              subtitle={variacaoLabel(dashboard?.variacaoDespesas) ?? "Saídas do período"}
              variant="expense"
              icon={<TrendingDown size={22} />}
            />
            <FinancialCard
              title="Maior gasto"
              value={formatCurrency(topCategory?.valor ?? 0)}
              subtitle={topCategory?.categoria ?? "Nenhuma despesa"}
              icon={<Tag size={22} />}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="border-border">
              <CardHeader><CardTitle>Receitas versus despesas</CardTitle></CardHeader>
              <CardContent>
                {revenueData.every((d) => d.income === 0 && d.expense === 0) ? (
                  <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                    Nenhuma movimentação no período selecionado.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                      <XAxis dataKey="month" stroke="#A1A1AA" />
                      <YAxis stroke="#A1A1AA" />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ backgroundColor: "#171717", border: "1px solid #2A2A2A", borderRadius: "8px" }} />
                      <Legend />
                      <Bar dataKey="income" fill="#22C55E" name="Receitas" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" fill="#EF4444" name="Despesas" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader><CardTitle>Despesas por categoria</CardTitle></CardHeader>
              <CardContent>
                {categoryData.length === 0 ? (
                  <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                    Nenhuma despesa registrada no período.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" outerRadius={92} dataKey="value" nameKey="name">
                        {categoryData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ backgroundColor: "#171717", border: "1px solid #2A2A2A", borderRadius: "8px" }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="border-border">
              <CardHeader><CardTitle>Últimas transações</CardTitle></CardHeader>
              <CardContent className="p-0">
                {!dashboard || dashboard.ultimasTransacoes.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">Nenhuma transação neste período.</p>
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
              <CardHeader><CardTitle>Metas em andamento</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {goals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Crie sua primeira meta para acompanhar seu progresso.</p>
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
