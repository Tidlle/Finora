import { useState } from "react";
import {
  AlertTriangle, BarChart3, CheckCircle, ChevronRight,
  Lightbulb, Sparkles, Target, TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/finance";
import {
  simularCenarioFinanceiro,
  type SimuladorResponse,
  type SimuladorCenario,
  type SimuladorProjecaoItem,
  type TipoSimulacao,
} from "@/services/intelligenceService";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// ── Helpers ───────────────────────────────────────────────────────────────────

const MESES_OPCOES = [
  { value: 3, label: "3 meses" },
  { value: 6, label: "6 meses" },
  { value: 12, label: "12 meses" },
  { value: 24, label: "24 meses" },
];

const TIPOS: { value: TipoSimulacao; label: string; descricao: string }[] = [
  { value: "META", label: "Meta financeira", descricao: "Calcule quando atingirá uma meta poupando mensalmente." },
  { value: "REDUCAO_DESPESAS", label: "Redução de despesas", descricao: "Veja o impacto de cortar gastos por categoria." },
  { value: "AUMENTO_RECEITA", label: "Aumento de receita", descricao: "Simule o efeito de ganhar mais por mês." },
  { value: "CENARIO_COMBINADO", label: "Cenário combinado", descricao: "Combine redução de gastos e aumento de renda." },
];

function numInput(
  label: string,
  value: string,
  onChange: (v: string) => void,
  placeholder: string,
  prefix = "R$"
) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="flex items-center border border-input rounded-lg bg-transparent overflow-hidden focus-within:ring-1 focus-within:ring-primary/40">
        {prefix && (
          <span className="px-2.5 text-xs text-muted-foreground border-r border-input bg-secondary/20 h-9 flex items-center">
            {prefix}
          </span>
        )}
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 h-9 px-3 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>
    </div>
  );
}

function selectInput(
  label: string,
  value: string,
  onChange: (v: string) => void,
  options: { value: string | number; label: string }[]
) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-card">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Formulários ───────────────────────────────────────────────────────────────

function FormMeta({
  state,
  onChange,
}: {
  state: Record<string, string>;
  onChange: (k: string, v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {numInput("Valor da meta", state.valorMeta, (v) => onChange("valorMeta", v), "10000")}
      {numInput("Valor já acumulado", state.valorAtual, (v) => onChange("valorAtual", v), "3500")}
      {numInput("Economia mensal planejada", state.economia, (v) => onChange("economia", v), "800")}
      {numInput("Prazo desejado (meses)", state.prazo, (v) => onChange("prazo", v), "6", "meses")}
    </div>
  );
}

function FormReducao({
  state,
  onChange,
}: {
  state: Record<string, string>;
  onChange: (k: string, v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Categoria (deixe em branco para todas)</label>
        <input
          type="text"
          value={state.categoria}
          onChange={(e) => onChange("categoria", e.target.value)}
          placeholder="ex: Alimentação"
          className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
      </div>
      {numInput("Percentual de redução", state.percentual, (v) => onChange("percentual", v), "10", "%")}
    </div>
  );
}

function FormReceita({
  state,
  onChange,
}: {
  state: Record<string, string>;
  onChange: (k: string, v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 max-w-xs">
      {numInput("Aumento mensal de receita", state.aumento, (v) => onChange("aumento", v), "1000")}
    </div>
  );
}

function FormCombinado({
  state,
  onChange,
}: {
  state: Record<string, string>;
  onChange: (k: string, v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {numInput("Percentual de redução de despesas", state.percentual, (v) => onChange("percentual", v), "10", "%")}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Categorias a reduzir (separadas por vírgula)</label>
        <input
          type="text"
          value={state.categoriasReducao}
          onChange={(e) => onChange("categoriasReducao", e.target.value)}
          placeholder="ex: Alimentação, Transporte"
          className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
      </div>
      {numInput("Aumento mensal de receita", state.aumento, (v) => onChange("aumento", v), "500")}
      {numInput("Valor da meta (opcional)", state.valorMeta, (v) => onChange("valorMeta", v), "10000")}
      {numInput("Valor já acumulado (opcional)", state.valorAtual, (v) => onChange("valorAtual", v), "3500")}
    </div>
  );
}

// ── Tooltip BRL ───────────────────────────────────────────────────────────────

function TooltipBRL({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-xs shadow-lg space-y-1">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

// ── Resultado ─────────────────────────────────────────────────────────────────

function ResultadoCard({ resultado }: { resultado: SimuladorResponse }) {
  const temProjecao = resultado.projecaoMensal.length > 0;
  const temCenarios = resultado.cenariosComparativos.length > 0;

  const chartData = resultado.projecaoMensal.map((p: SimuladorProjecaoItem) => ({
    mes: p.mes.slice(5), // MM
    "Saldo projetado": p.saldoProjetado,
    ...(p.valorAcumuladoMeta != null ? { Meta: p.valorAcumuladoMeta } : {}),
    ...(p.receitasProjetadas != null ? { Receitas: p.receitasProjetadas } : {}),
    ...(p.despesasProjetadas != null ? { Despesas: p.despesasProjetadas } : {}),
  }));

  return (
    <div className="space-y-5">
      {/* Card principal */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">
              Finora Intelligence
            </span>
          </div>
          <h3 className="text-lg font-bold text-foreground">{resultado.titulo}</h3>
          <p className="text-sm text-foreground leading-relaxed">{resultado.mensagemPrincipal}</p>

          {/* Indicadores do resultado */}
          {Object.keys(resultado.resultado).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
              {_indicadoresResultado(resultado).map(({ label, valor, cor }) => (
                <div key={label} className="p-3 rounded-lg bg-secondary/40 border border-border space-y-0.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className={`text-sm font-bold ${cor}`}>{valor}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alertas */}
      {resultado.alertas.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-4 space-y-2">
            {resultado.alertas.map((a, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-300">{a}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Gráfico */}
      {temProjecao && chartData.length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp size={15} className="text-primary" />
              Projeção mensal
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="saldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#facc15" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="meta" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#888" }} />
                <YAxis tick={{ fontSize: 11, fill: "#888" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<TooltipBRL />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="Saldo projetado" stroke="#facc15" fill="url(#saldo)" strokeWidth={2} dot={false} />
                {chartData[0]?.Meta != null && (
                  <Area type="monotone" dataKey="Meta" stroke="#22c55e" fill="url(#meta)" strokeWidth={2} dot={false} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Cenários comparativos */}
      {temCenarios && (
        <Card className="border-border">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 size={15} className="text-blue-400" />
              Cenários comparativos
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 space-y-2">
            {resultado.cenariosComparativos.map((c: SimuladorCenario, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
                <ChevronRight size={14} className="text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{c.nome}</p>
                  <p className="text-xs text-muted-foreground">{c.descricao}</p>
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  {c.saldoFinalProjetado != null && (
                    <p className="text-sm font-bold text-primary">{formatCurrency(c.saldoFinalProjetado)}</p>
                  )}
                  {c.mesesParaAtingir != null && (
                    <p className="text-xs text-muted-foreground">{c.mesesParaAtingir} meses</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recomendações */}
      {resultado.recomendacoes.length > 0 && (
        <Card className="border-border bg-secondary/20">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Lightbulb size={15} className="text-yellow-400" />
              Recomendações
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 space-y-2">
            {resultado.recomendacoes.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle size={13} className="shrink-0 mt-0.5 text-primary/50" />
                <span>{r}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Extrai os KPIs mais relevantes do resultado para exibir como chips
function _indicadoresResultado(res: SimuladorResponse) {
  const r = res.resultado as Record<string, unknown>;
  const tipo = res.tipoSimulacao;
  const items: { label: string; valor: string; cor: string }[] = [];

  if (tipo === "META") {
    if (r.mesesParaAtingir != null) items.push({ label: "Meses para atingir", valor: String(r.mesesParaAtingir), cor: "text-primary" });
    if (r.valorRestante != null) items.push({ label: "Valor restante", valor: formatCurrency(Number(r.valorRestante)), cor: "text-yellow-400" });
    if (r.valorMensalNecessarioParaPrazo != null) items.push({ label: "Para atingir no prazo", valor: formatCurrency(Number(r.valorMensalNecessarioParaPrazo)), cor: "text-orange-400" });
    if (r.saldoFinalProjetado != null) items.push({ label: "Saldo final projetado", valor: formatCurrency(Number(r.saldoFinalProjetado)), cor: "text-green-400" });
  } else if (tipo === "REDUCAO_DESPESAS") {
    if (r.economiaMensalProjetada != null) items.push({ label: "Economia mensal", valor: formatCurrency(Number(r.economiaMensalProjetada)), cor: "text-green-400" });
    if (r.impactoPeriodo != null) items.push({ label: "Impacto no período", valor: formatCurrency(Number(r.impactoPeriodo)), cor: "text-primary" });
    if (r.novoSaldoMensal != null) items.push({ label: "Novo saldo mensal", valor: formatCurrency(Number(r.novoSaldoMensal)), cor: "text-foreground" });
  } else if (tipo === "AUMENTO_RECEITA") {
    if (r.impactoPeriodo != null) items.push({ label: "Impacto no período", valor: formatCurrency(Number(r.impactoPeriodo)), cor: "text-green-400" });
    if (r.novoSaldoMensal != null) items.push({ label: "Novo saldo mensal", valor: formatCurrency(Number(r.novoSaldoMensal)), cor: "text-primary" });
    if (r.saldoFinalProjetado != null) items.push({ label: "Saldo final projetado", valor: formatCurrency(Number(r.saldoFinalProjetado)), cor: "text-foreground" });
  } else if (tipo === "CENARIO_COMBINADO") {
    if (r.melhoraMensal != null) items.push({ label: "Melhora mensal", valor: formatCurrency(Number(r.melhoraMensal)), cor: "text-green-400" });
    if (r.impactoPeriodo != null) items.push({ label: "Impacto no período", valor: formatCurrency(Number(r.impactoPeriodo)), cor: "text-primary" });
    if (r.mesesParaMeta != null) items.push({ label: "Meses para a meta", valor: String(r.mesesParaMeta), cor: "text-yellow-400" });
    if (r.saldoFinalProjetado != null) items.push({ label: "Saldo final projetado", valor: formatCurrency(Number(r.saldoFinalProjetado)), cor: "text-foreground" });
  }

  return items;
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function SimulatorPage() {
  const [tipo, setTipo] = useState<TipoSimulacao>("META");
  const [meses, setMeses] = useState("6");
  const [fields, setFields] = useState<Record<string, string>>({
    valorMeta: "", valorAtual: "", economia: "", prazo: "",
    categoria: "", percentual: "", aumento: "", categoriasReducao: "",
  });
  const [resultado, setResultado] = useState<SimuladorResponse | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(false);
  const [erroCampos, setErroCampos] = useState("");

  function setField(k: string, v: string) {
    setFields((prev) => ({ ...prev, [k]: v }));
  }

  function validar(): string {
    const mesesNum = parseInt(meses);
    if (![3, 6, 12, 24].includes(mesesNum)) return "Selecione um período de projeção válido.";

    if (tipo === "META") {
      if (!fields.valorMeta || parseFloat(fields.valorMeta) <= 0)
        return "Informe um valor de meta maior que zero.";
      if (!fields.economia || parseFloat(fields.economia) <= 0)
        return "Informe uma economia mensal maior que zero.";
    }
    if (tipo === "REDUCAO_DESPESAS") {
      const pct = parseFloat(fields.percentual);
      if (!fields.percentual || isNaN(pct) || pct <= 0 || pct > 100)
        return "Informe um percentual de redução entre 1 e 100.";
    }
    if (tipo === "AUMENTO_RECEITA") {
      if (!fields.aumento || parseFloat(fields.aumento) <= 0)
        return "Informe um valor de aumento de receita maior que zero.";
    }
    if (tipo === "CENARIO_COMBINADO") {
      const pct = parseFloat(fields.percentual);
      const aumm = parseFloat(fields.aumento);
      const temReducao = !isNaN(pct) && pct > 0 && pct <= 100;
      const temAumento = !isNaN(aumm) && aumm > 0;
      if (!temReducao && !temAumento)
        return "Informe ao menos um parâmetro: percentual de redução ou aumento de receita.";
    }
    return "";
  }

  async function simular() {
    const msg = validar();
    if (msg) { setErroCampos(msg); return; }
    setErroCampos("");
    setCarregando(true);
    setErro(false);
    setResultado(null);

    const parametros: Record<string, unknown> = {};

    if (tipo === "META") {
      if (fields.valorMeta) parametros.valorMeta = parseFloat(fields.valorMeta);
      if (fields.valorAtual) parametros.valorAtual = parseFloat(fields.valorAtual);
      if (fields.economia) parametros.economiaMensalPlanejada = parseFloat(fields.economia);
      if (fields.prazo) parametros.prazoDesejadoMeses = parseInt(fields.prazo);
    }
    if (tipo === "REDUCAO_DESPESAS") {
      if (fields.categoria.trim()) parametros.categoria = fields.categoria.trim();
      if (fields.percentual) parametros.percentualReducaoDespesa = parseFloat(fields.percentual);
    }
    if (tipo === "AUMENTO_RECEITA") {
      if (fields.aumento) parametros.aumentoReceitaMensal = parseFloat(fields.aumento);
    }
    if (tipo === "CENARIO_COMBINADO") {
      if (fields.percentual) parametros.percentualReducaoDespesa = parseFloat(fields.percentual);
      if (fields.categoriasReducao.trim()) {
        parametros.categoriasReducao = fields.categoriasReducao.split(",").map((s) => s.trim()).filter(Boolean);
      }
      if (fields.aumento) parametros.aumentoReceitaMensal = parseFloat(fields.aumento);
      if (fields.valorMeta) parametros.valorMeta = parseFloat(fields.valorMeta);
      if (fields.valorAtual) parametros.valorAtual = parseFloat(fields.valorAtual);
    }

    try {
      const res = await simularCenarioFinanceiro({
        tipoSimulacao: tipo,
        mesesProjecao: parseInt(meses),
        parametros: parametros as any,
      });
      setResultado(res);
    } catch {
      setErro(true);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AppShell
      title="Simulador financeiro"
      subtitle="Simule metas, receitas, despesas e cenários futuros antes de decidir."
    >
      <div className="space-y-5">
        {/* Seleção do tipo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TIPOS.map((t) => (
            <button
              key={t.value}
              onClick={() => { setTipo(t.value); setResultado(null); setErroCampos(""); }}
              className={`text-left p-4 rounded-xl border transition-all space-y-1 ${
                tipo === t.value
                  ? "border-primary/60 bg-primary/10"
                  : "border-border bg-secondary/20 hover:border-primary/30"
              }`}
            >
              <Target size={15} className={tipo === t.value ? "text-primary" : "text-muted-foreground"} />
              <p className={`text-sm font-semibold ${tipo === t.value ? "text-foreground" : "text-muted-foreground"}`}>
                {t.label}
              </p>
              <p className="text-xs text-muted-foreground leading-snug">{t.descricao}</p>
            </button>
          ))}
        </div>

        {/* Formulário */}
        <Card className="border-border">
          <CardHeader className="pb-3 pt-5">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles size={14} className="text-primary" />
              Parâmetros da simulação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pb-5">
            {tipo === "META" && <FormMeta state={fields} onChange={setField} />}
            {tipo === "REDUCAO_DESPESAS" && <FormReducao state={fields} onChange={setField} />}
            {tipo === "AUMENTO_RECEITA" && <FormReceita state={fields} onChange={setField} />}
            {tipo === "CENARIO_COMBINADO" && <FormCombinado state={fields} onChange={setField} />}

            <div className="pt-1">
              {selectInput("Período de projeção", meses, setMeses,
                MESES_OPCOES.map((m) => ({ value: m.value, label: m.label }))
              )}
            </div>

            {erroCampos && (
              <div className="flex items-center gap-2 text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                <AlertTriangle size={14} className="shrink-0" />
                {erroCampos}
              </div>
            )}

            <Button onClick={simular} disabled={carregando} className="w-full sm:w-auto">
              {carregando ? "Calculando…" : "Simular cenário"}
            </Button>
          </CardContent>
        </Card>

        {/* Loading */}
        {carregando && (
          <Card className="border-border">
            <CardContent className="p-10 flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Sparkles size={22} className="text-primary" />
              </div>
              <p className="font-medium text-foreground">Calculando cenário inteligente…</p>
              <p className="text-sm text-muted-foreground">Usando seus dados financeiros reais</p>
              <div className="space-y-2 w-full max-w-sm">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-5/6" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Erro */}
        {erro && !carregando && (
          <Card className="border-red-500/30 bg-red-500/10">
            <CardContent className="p-5 text-sm text-red-400 text-center">
              Não foi possível gerar a simulação agora. Tente novamente.
            </CardContent>
          </Card>
        )}

        {/* Resultado */}
        {resultado && !carregando && <ResultadoCard resultado={resultado} />}
      </div>
    </AppShell>
  );
}
