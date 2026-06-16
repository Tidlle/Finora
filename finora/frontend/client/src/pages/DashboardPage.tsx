import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingDown, TrendingUp, Wallet, Tag } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { FinancialCard, GoalProgressCard, TransactionItem } from "@/components/FinancialComponents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useFinora } from "@/contexts/FinoraContext";
import { formatCurrency, formatDate, monthLabel } from "@/lib/finance";
import { buscarResumoDashboard, type DashboardResumoResponse } from "@/services/dashboardService";
import { listarMetas, type MetaResponse } from "@/services/metaService";

const chartColors = ["#FACC15", "#38BDF8", "#EF4444", "#22C55E", "#A78BFA", "#FB923C"];

function mesAtualPadrao() {
  const data = new Date();
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function nomeCurtoDoMes(mes: string) {
  const [ano, numero] = mes.split("-").map(Number);
  return new Date(ano, numero - 1, 1).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

export default function DashboardPage() {
  const { currentUser } = useFinora();
  const [selectedMonth, setSelectedMonth] = useState(mesAtualPadrao());
  const [dashboard, setDashboard] = useState<DashboardResumoResponse | null>(null);
  const [goals, setGoals] = useState<MetaResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function carregarDashboard() {
      try {
        setLoading(true);
        const [resumo, metas] = await Promise.all([
          buscarResumoDashboard(selectedMonth),
          listarMetas("EM_ANDAMENTO"),
        ]);

        if (!ativo) return;
        setDashboard(resumo);
        setGoals(metas);
      } catch (error) {
        if (!ativo) return;
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("Erro ao carregar dashboard.");
        }
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregarDashboard();

    return () => {
      ativo = false;
    };
  }, [selectedMonth]);

  const categoryData = useMemo(
    () => dashboard?.gastosPorCategoria.map((item, index) => ({
      name: item.categoria,
      value: item.valor,
      color: chartColors[index % chartColors.length],
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

  return (
    <AppShell title={`Olá, ${firstName}`} subtitle="Aqui está o resumo das suas finanças.">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-heading font-semibold">Resumo mensal</h2>
          <p className="text-sm text-muted-foreground capitalize">{monthLabel(selectedMonth)}</p>
        </div>
        <div className="w-full sm:w-52">
          <Input aria-label="Selecionar mês" type="month" value={selectedMonth} onChange={(event) => event.target.value && setSelectedMonth(event.target.value)} />
        </div>
      </div>

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

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="border-border">
              <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-20" />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <FinancialCard title="Saldo atual" value={formatCurrency(dashboard?.saldo ?? 0)} subtitle="Receitas menos despesas" icon={<Wallet size={22} />} />
            <FinancialCard title="Receitas" value={formatCurrency(dashboard?.totalReceitas ?? 0)} subtitle="Entradas do período" variant="income" icon={<TrendingUp size={22} />} />
            <FinancialCard title="Despesas" value={formatCurrency(dashboard?.totalDespesas ?? 0)} subtitle="Saídas do período" variant="expense" icon={<TrendingDown size={22} />} />
            <FinancialCard title="Maior gasto" value={formatCurrency(topCategory?.valor ?? 0)} subtitle={topCategory?.categoria ?? "Nenhuma despesa"} icon={<Tag size={22} />} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="border-border">
              <CardHeader><CardTitle>Receitas versus despesas</CardTitle></CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader><CardTitle>Despesas por categoria</CardTitle></CardHeader>
              <CardContent>
                {categoryData.length === 0 ? (
                  <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">Nenhuma despesa registrada neste mês.</div>
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
                  <p className="p-6 text-sm text-muted-foreground">Você ainda não cadastrou transações neste período.</p>
                ) : dashboard.ultimasTransacoes.map((transaction) => (
                  <TransactionItem
                    key={transaction.id}
                    date={formatDate(transaction.dataTransacao)}
                    description={transaction.descricao}
                    category={transaction.categoriaNome}
                    type={transaction.tipo === "RECEITA" ? "income" : "expense"}
                    amount={transaction.valor}
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
