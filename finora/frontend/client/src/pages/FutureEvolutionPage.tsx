import { useEffect, useState } from "react";
import {
  TrendingUp, TrendingDown, Wallet, AlertTriangle, CheckCircle,
  BarChart3, Sparkles, Target, ShieldAlert, ShieldCheck,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, Legend, Line, ComposedChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/finance";
import {
  buscarProjecoesInteligentes,
  type ProjecoesInteligenteResponse,
  type ProjecaoTendencia,
} from "@/services/intelligenceService";

// ── Helpers ──────────────────────────────────────────────────────────────────

function nomeCurtoDoMes(mes: string) {
  const [ano, num] = mes.split("-").map(Number);
  return new Date(ano, num - 1, 1).toLocaleDateString("pt-BR", {
    month: "short",
    year: "2-digit",
  });
}

const TENDENCIA_CONFIG: Record<
  ProjecaoTendencia,
  { label: string; color: string; bg: string; border: string; icon: JSX.Element }
> = {
  POSITIVA: {
    label: "Positiva",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    icon: <TrendingUp size={14} className="text-green-400" />,
  },
  ESTAVEL: {
    label: "Estável",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    icon: <TrendingUp size={14} className="text-blue-400" />,
  },
  ATENCAO: {
    label: "Atenção",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    icon: <AlertTriangle size={14} className="text-yellow-400" />,
  },
  NEGATIVA: {
    label: "Negativa",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    icon: <TrendingDown size={14} className="text-red-400" />,
  },
};

const tooltipStyle = {
  backgroundColor: "#171717",
  border: "1px solid #2A2A2A",
  borderRadius: "10px",
  fontSize: "12px",
};

// ── Componentes de seção ──────────────────────────────────────────────────────

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  colorClass = "text-foreground",
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  colorClass?: string;
}) {
  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <div className="p-2 rounded-lg bg-muted shrink-0">{icon}</div>
        </div>
        <p className={`text-xl font-bold font-heading ${colorClass}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

const OPCOES_MESES = [3, 6, 12] as const;

export default function FutureEvolutionPage() {
  const [meses, setMeses] = useState<3 | 6 | 12>(6);
  const [dados, setDados] = useState<ProjecoesInteligenteResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;
    setLoading(true);
    buscarProjecoesInteligentes(meses)
      .then((r) => { if (ativo) setDados(r); })
      .catch(() => { if (ativo) setDados(null); })
      .finally(() => { if (ativo) setLoading(false); });
    return () => { ativo = false; };
  }, [meses]);

  const analise = dados?.analise;
  const tendCfg = TENDENCIA_CONFIG[analise?.tendencia ?? "ESTAVEL"];
  const semDados = !loading && (!dados || dados.projecoes.length === 0);

  const chartData = (dados?.projecoes ?? []).map((p) => ({
    mes: nomeCurtoDoMes(p.mes),
    receitas: p.receitasPrevistas,
    despesas: p.despesasPrevistas,
    acumulado: p.saldoAcumulado,
  }));

  return (
    <AppShell
      title="Projeções financeiras"
      subtitle="Tendências e previsões baseadas no seu histórico."
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-accent/8 border border-accent/15 text-sm text-accent font-medium w-fit">
          <Sparkles size={14} />
          Finora Intelligence — projeções baseadas no histórico real
        </div>
        <div className="flex gap-1.5">
          {OPCOES_MESES.map((m) => (
            <button
              key={m}
              onClick={() => setMeses(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                meses === m
                  ? "bg-accent text-black"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {m} meses
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading ─────────────────────────────────────────────── */}
      {loading && (
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
          <Card className="border-border">
            <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
            <CardContent><Skeleton className="h-[280px] w-full" /></CardContent>
          </Card>
        </>
      )}

      {/* ── Sem dados ───────────────────────────────────────────── */}
      {!loading && semDados && (
        <Card className="border-border">
          <CardContent className="p-16 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
              <BarChart3 size={26} className="text-muted-foreground" />
            </div>
            <div>
              <p className="font-heading font-bold text-lg">
                {analise?.mensagemPrincipal ?? "Dados insuficientes"}
              </p>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
                {analise?.observacoes?.[0] ??
                  "Cadastre mais transações para que o Finora calcule sua evolução financeira futura."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Conteúdo principal ──────────────────────────────────── */}
      {!loading && !semDados && analise && (
        <>
          {/* Cards de resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <Card className={`border ${tendCfg.border} ${tendCfg.bg}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <p className="text-xs text-muted-foreground font-medium">Tendência financeira</p>
                  <div className="p-2 rounded-lg bg-muted shrink-0">{tendCfg.icon}</div>
                </div>
                <p className={`text-xl font-bold font-heading ${tendCfg.color}`}>
                  {tendCfg.label}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Baseada nos últimos meses</p>
              </CardContent>
            </Card>

            <MetricCard
              title="Saldo final projetado"
              value={formatCurrency(dados?.projecoes.at(-1)?.saldoAcumulado ?? 0)}
              subtitle={`Acumulado em ${meses} meses`}
              icon={<Wallet size={16} className="text-accent" />}
              colorClass="text-accent"
            />

            <MetricCard
              title="Economia média mensal"
              value={formatCurrency(Math.abs(analise.economiaMediaMensal))}
              subtitle={analise.economiaMediaMensal >= 0 ? "Você está poupando" : "Déficit mensal"}
              icon={
                analise.economiaMediaMensal >= 0
                  ? <TrendingUp size={16} className="text-green-400" />
                  : <TrendingDown size={16} className="text-red-400" />
              }
              colorClass={analise.economiaMediaMensal >= 0 ? "text-green-400" : "text-red-400"}
            />

            <Card className={`border ${
              analise.riscoSaldoNegativo
                ? "border-red-500/25 bg-red-500/8"
                : "border-green-500/20 bg-green-500/8"
            }`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <p className="text-xs text-muted-foreground font-medium">Risco de saldo negativo</p>
                  <div className="p-2 rounded-lg bg-muted shrink-0">
                    {analise.riscoSaldoNegativo
                      ? <ShieldAlert size={16} className="text-red-400" />
                      : <ShieldCheck size={16} className="text-green-400" />
                    }
                  </div>
                </div>
                <p className={`text-xl font-bold font-heading ${
                  analise.riscoSaldoNegativo ? "text-red-400" : "text-green-400"
                }`}>
                  {analise.riscoSaldoNegativo ? "Sim" : "Não"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {analise.riscoSaldoNegativo && analise.mesRiscoSaldoNegativo
                    ? `Risco em ${analise.mesRiscoSaldoNegativo}`
                    : "Saldo projetado positivo"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de projeção */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-base">
                  Projeção financeira — próximos {meses} meses
                </CardTitle>
                <span className={`text-xs font-medium px-2 py-1 rounded-md ${tendCfg.bg} ${tendCfg.color} border ${tendCfg.border}`}>
                  {tendCfg.icon}&nbsp;{tendCfg.label}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="acGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FACC15" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#FACC15" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" />
                  <XAxis dataKey="mes" stroke="#52525B" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#52525B" tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v, name) => {
                      const labels: Record<string, string> = {
                        receitas: "Receitas previstas",
                        despesas: "Despesas previstas",
                        acumulado: "Saldo acumulado",
                      };
                      return [formatCurrency(Number(v)), labels[name as string] ?? name];
                    }}
                    contentStyle={tooltipStyle}
                  />
                  <Legend
                    formatter={(value) => ({
                      receitas: "Receitas previstas",
                      despesas: "Despesas previstas",
                      acumulado: "Saldo acumulado",
                    }[value] ?? value)}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="acumulado"
                    stroke="#FACC15"
                    fill="url(#acGradient)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#FACC15", strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="receitas"
                    stroke="#22C55E"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="5 3"
                  />
                  <Line
                    type="monotone"
                    dataKey="despesas"
                    stroke="#EF4444"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="5 3"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Análise inteligente */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-accent" />
                <CardTitle className="text-base">Análise inteligente</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="flex items-start gap-3 p-3.5 rounded-xl border bg-accent/8 border-accent/20 text-sm text-accent">
                <Sparkles size={14} className="shrink-0 mt-0.5" />
                {analise.mensagemPrincipal}
              </div>
              {analise.observacoes.map((obs, i) => {
                const isNeg = obs.toLowerCase().includes("superam") ||
                  obs.toLowerCase().includes("negativo") ||
                  obs.toLowerCase().includes("baixa");
                const isWarn = obs.toLowerCase().includes("crescendo") ||
                  obs.toLowerCase().includes("atenção") ||
                  obs.toLowerCase().includes("poucos");
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border text-sm ${
                      isNeg
                        ? "bg-red-500/8 border-red-500/20 text-red-300"
                        : isWarn
                        ? "bg-yellow-500/8 border-yellow-500/20 text-yellow-300"
                        : "bg-green-500/8 border-green-500/20 text-green-300"
                    }`}
                  >
                    {isNeg || isWarn
                      ? <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      : <CheckCircle size={14} className="shrink-0 mt-0.5" />
                    }
                    {obs}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Cenários */}
          {dados && dados.cenarios.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Cenários comparativos
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {dados.cenarios.map((c, i) => (
                  <Card key={i} className="border-border">
                    <CardContent className="p-4 space-y-2">
                      <p className="text-xs font-semibold text-accent">{c.nome}</p>
                      <p className="text-xs text-muted-foreground">{c.descricao}</p>
                      <p className="text-lg font-bold font-heading">
                        {formatCurrency(c.saldoFinalProjetado)}
                      </p>
                      {c.diferencaVsAtual !== 0 && (
                        <p className={`text-xs font-medium ${
                          c.diferencaVsAtual > 0 ? "text-green-400" : "text-red-400"
                        }`}>
                          {c.diferencaVsAtual > 0 ? "+" : ""}
                          {formatCurrency(c.diferencaVsAtual)} vs cenário atual
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Metas */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-accent" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Previsão para metas
              </h2>
            </div>
            {dados && dados.metas.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dados.metas.map((m, i) => (
                  <Card key={i} className="border-border">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{m.nome}</p>
                        {m.mesesEstimadosParaConclusao === 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/20">
                            Concluída
                          </span>
                        )}
                      </div>
                      {m.valorRestante > 0 && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Valor restante</span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(m.valorRestante)}
                          </span>
                        </div>
                      )}
                      {m.mesesEstimadosParaConclusao != null && m.mesesEstimadosParaConclusao > 0 && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Previsão</span>
                          <span className="font-medium text-accent">
                            ~{m.mesesEstimadosParaConclusao} {m.mesesEstimadosParaConclusao === 1 ? "mês" : "meses"}
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground leading-relaxed">{m.mensagem}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-border">
                <CardContent className="p-8 text-center">
                  <Target size={24} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma meta cadastrada. Crie metas financeiras para ver a previsão de conclusão.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}
