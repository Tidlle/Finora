import { useEffect, useState } from "react";
import {
  ArrowLeft, Sparkles, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, Target, BarChart3, Lightbulb, ChevronRight, Calendar,
} from "lucide-react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/finance";
import {
  buscarRelatorioMensal,
  type RelatorioMensalResponse,
  type SecaoRelatorio,
} from "@/services/intelligenceService";

// ── Helpers ───────────────────────────────────────────────────────────────────

function mesAtual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function mesesDisponiveis(): { value: string; label: string }[] {
  const MESES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  const resultado = [];
  const hoje = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${MESES[d.getMonth()]} de ${d.getFullYear()}`;
    resultado.push({ value, label });
  }
  return resultado;
}

function classificacaoCor(classificacao: string): string {
  if (classificacao === "EXCELENTE" || classificacao === "BOA") return "text-green-400";
  if (classificacao === "ATENCAO") return "text-yellow-400";
  if (classificacao === "CRITICA") return "text-red-400";
  return "text-muted-foreground";
}

function classificacaoBg(classificacao: string): string {
  if (classificacao === "EXCELENTE" || classificacao === "BOA") return "bg-green-500/10 border-green-500/30";
  if (classificacao === "ATENCAO") return "bg-yellow-500/10 border-yellow-500/30";
  if (classificacao === "CRITICA") return "bg-red-500/10 border-red-500/30";
  return "bg-secondary/30 border-border";
}

function secaoIcone(tipo: string) {
  const cls = "shrink-0 mt-0.5";
  if (tipo === "RESUMO") return <BarChart3 size={16} className={`${cls} text-primary`} />;
  if (tipo === "CATEGORIAS") return <Target size={16} className={`${cls} text-blue-400`} />;
  if (tipo === "INSIGHTS") return <Lightbulb size={16} className={`${cls} text-yellow-400`} />;
  if (tipo === "ALERTAS") return <AlertTriangle size={16} className={`${cls} text-orange-400`} />;
  if (tipo === "SCORE") return <Sparkles size={16} className={`${cls} text-primary`} />;
  if (tipo === "RECOMENDACOES") return <TrendingUp size={16} className={`${cls} text-green-400`} />;
  if (tipo === "PROJECAO") return <TrendingUp size={16} className={`${cls} text-blue-400`} />;
  if (tipo === "METAS") return <Target size={16} className={`${cls} text-purple-400`} />;
  return <ChevronRight size={16} className={`${cls} text-muted-foreground`} />;
}

function secaoCorBorda(tipo: string): string {
  if (tipo === "ALERTAS") return "border-l-orange-500/60";
  if (tipo === "SCORE") return "border-l-primary/60";
  if (tipo === "RECOMENDACOES") return "border-l-green-500/60";
  if (tipo === "METAS") return "border-l-purple-500/60";
  if (tipo === "PROJECAO") return "border-l-blue-500/60";
  return "border-l-border";
}

// ── Componentes ───────────────────────────────────────────────────────────────

function CardIndicador({
  label, valor, cor, prefixo = "",
}: { label: string; valor: string | number; cor?: string; prefixo?: string }) {
  return (
    <div className="flex flex-col gap-1 p-4 rounded-xl bg-secondary/30 border border-border">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className={`text-xl font-bold ${cor ?? "text-foreground"}`}>
        {prefixo}{typeof valor === "number" ? formatCurrency(valor) : valor}
      </span>
    </div>
  );
}

function SecaoCard({ secao }: { secao: SecaoRelatorio }) {
  return (
    <Card className={`border border-l-2 ${secaoCorBorda(secao.tipo)}`}>
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          {secaoIcone(secao.tipo)}
          {secao.titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <ul className="space-y-2">
          {secao.itens.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle size={13} className="mt-0.5 shrink-0 text-primary/50" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function MonthlyReportPage() {
  const [, setLocation] = useLocation();
  const [mes, setMes] = useState(mesAtual);
  const [relatorio, setRelatorio] = useState<RelatorioMensalResponse | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(false);
  const meses = mesesDisponiveis();

  useEffect(() => {
    setCarregando(true);
    setErro(false);
    setRelatorio(null);
    buscarRelatorioMensal(mes)
      .then(setRelatorio)
      .catch(() => setErro(true))
      .finally(() => setCarregando(false));
  }, [mes]);

  const ind = relatorio?.indicadores;
  const saldo = ind?.saldo ?? 0;
  const saldoPositivo = saldo > 0;
  const saldoNegativo = saldo < 0;

  const cardBg = saldoPositivo
    ? "bg-green-500/10 border-green-500/30"
    : saldoNegativo
    ? "bg-red-500/10 border-red-500/30"
    : "bg-yellow-500/10 border-yellow-500/30";

  const cardTextCor = saldoPositivo
    ? "text-green-400"
    : saldoNegativo
    ? "text-red-400"
    : "text-yellow-400";

  return (
    <AppShell
      title="Relatório mensal"
      subtitle="Resumo inteligente consolidado do seu mês financeiro."
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => setLocation("/dashboard")}>
          <ArrowLeft size={16} /> Voltar ao dashboard
        </Button>

        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-muted-foreground" />
          <select
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="h-8 rounded-md border border-input bg-transparent px-3 text-sm text-foreground focus:outline-none"
          >
            {meses.map((m) => (
              <option key={m.value} value={m.value} className="bg-card">
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading */}
      {carregando && (
        <Card className="border-border">
          <CardContent className="p-12 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Sparkles size={24} className="text-primary" />
            </div>
            <p className="font-medium text-foreground">Gerando relatório mensal…</p>
            <p className="text-sm text-muted-foreground">Consolidando insights, score e recomendações</p>
            <div className="space-y-3 w-full max-w-md mt-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Erro */}
      {erro && !carregando && (
        <Card className="border-red-500/30 bg-red-500/10">
          <CardContent className="p-6 text-center text-sm text-red-400">
            Não foi possível carregar o relatório mensal agora. Tente novamente.
          </CardContent>
        </Card>
      )}

      {/* Relatório */}
      {relatorio && !carregando && (
        <div className="space-y-5">
          {/* Header do relatório */}
          <Card className={`border ${cardBg}`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-primary" />
                    <span className="text-xs text-primary font-medium uppercase tracking-wider">
                      Finora Intelligence
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{relatorio.titulo}</h2>
                  <p className="text-sm text-muted-foreground">{relatorio.subtitulo}</p>
                </div>
              </div>

              <p className={`mt-4 text-base font-medium ${cardTextCor}`}>
                {relatorio.mensagemPrincipal}
              </p>
            </CardContent>
          </Card>

          {/* Indicadores */}
          {ind && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <CardIndicador
                label="Receitas"
                valor={ind.totalReceitas}
                cor="text-green-400"
              />
              <CardIndicador
                label="Despesas"
                valor={ind.totalDespesas}
                cor="text-red-400"
              />
              <CardIndicador
                label="Saldo"
                valor={ind.saldo}
                cor={saldoPositivo ? "text-green-400" : "text-red-400"}
              />
              {ind.scoreFinanceiro > 0 ? (
                <div className="flex flex-col gap-1 p-4 rounded-xl bg-secondary/30 border border-border">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Score</span>
                  <span className="text-xl font-bold text-primary">{ind.scoreFinanceiro}<span className="text-sm text-muted-foreground">/100</span></span>
                </div>
              ) : (
                <CardIndicador
                  label="Economia potencial"
                  valor={ind.economiaPotencial}
                  cor="text-yellow-400"
                />
              )}
            </div>
          )}

          {ind && ind.maiorCategoria && (
            <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
              <Target size={13} className="text-blue-400" />
              Maior gasto: <span className="text-foreground font-medium">{ind.maiorCategoria}</span>
              {ind.riscoSaldoNegativo && (
                <>
                  <span className="mx-1">·</span>
                  <TrendingDown size={13} className="text-red-400" />
                  <span className="text-red-400">Risco de saldo negativo</span>
                </>
              )}
            </div>
          )}

          {/* Seções */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatorio.secoes.map((s, i) => (
              <SecaoCard key={i} secao={s} />
            ))}
          </div>

          {/* Conclusão */}
          <Card className="border-border bg-secondary/20">
            <CardContent className="p-5 flex items-start gap-3">
              <Lightbulb size={18} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Conclusão do período</p>
                <p className="text-sm text-foreground">{relatorio.conclusao}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
