import { apiRequest } from "./api";
import { obterToken } from "./authService";
import type { TipoTransacao } from "./categoriaService";

export type SugestaoCategoria = {
  categoriaId: number | null;
  categoriaNome: string | null;
  confianca: number;
  motivo: string;
};

export type SugestaoLoteItem = SugestaoCategoria & {
  descricao: string;
};

type TransacaoSimples = {
  descricao: string;
  tipo: TipoTransacao;
};

type LoteRequest = {
  transacoes: TransacaoSimples[];
};

type LoteResponse = {
  sugestoes: SugestaoLoteItem[];
};

export async function sugerirCategoriasLote(
  transacoes: TransacaoSimples[]
): Promise<SugestaoLoteItem[]> {
  const token = obterToken();
  const body: LoteRequest = { transacoes };
  const resposta = await apiRequest<LoteResponse>(
    "/intelligence/sugerir-categorias-lote",
    { method: "POST", body, token }
  );
  return resposta.sugestoes;
}

// ── Insights ──────────────────────────────────────────────────────────────────

export type InsightTipo = "POSITIVO" | "ALERTA" | "NEGATIVO" | "INFORMATIVO";
export type InsightPrioridade = "ALTA" | "MEDIA" | "BAIXA";

export type InsightItem = {
  tipo: InsightTipo;
  titulo: string;
  mensagem: string;
  prioridade: InsightPrioridade;
};

export type InsightsResumo = {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  maiorCategoriaDespesa: string | null;
};

export type InsightsResponse = {
  insights: InsightItem[];
  resumo: InsightsResumo | null;
};

// ── Anomalias ─────────────────────────────────────────────────────────────────

export type AnomaliasTipo =
  | "TRANSACAO_INCOMUM"
  | "CATEGORIA_EM_ALTA"
  | "GASTO_ACIMA_DA_MEDIA"
  | "CONCENTRACAO_DE_GASTOS"
  | "INFORMATIVO";

export type AnomaliasSeveridade = "ALTA" | "MEDIA" | "BAIXA";

export type AnomaliaItem = {
  tipo: AnomaliasTipo;
  categoria: string | null;
  descricao: string | null;
  valor: number | null;
  mensagem: string;
  severidade: AnomaliasSeveridade;
  percentualAcimaMedia: number | null;
};

export type AnomaliasResumo = {
  totalAnomalias: number;
  anomaliasAltaSeveridade: number;
  categoriaMaisCritica: string | null;
};

export type AnomaliasResponse = {
  anomalias: AnomaliaItem[];
  resumo: AnomaliasResumo | null;
};

export async function buscarAnomalias(params: {
  mes?: string;
  dataInicial?: string;
  dataFinal?: string;
}): Promise<AnomaliasResponse> {
  const token = obterToken();
  const query = new URLSearchParams();
  if (params.mes) query.set("mes", params.mes);
  if (params.dataInicial) query.set("dataInicial", params.dataInicial);
  if (params.dataFinal) query.set("dataFinal", params.dataFinal);
  const url = `/intelligence/anomalias${query.toString() ? `?${query}` : ""}`;
  return apiRequest<AnomaliasResponse>(url, { method: "GET", token });
}

// ── Projeções inteligentes ────────────────────────────────────────────────────

export type ProjecaoItem = {
  mes: string;
  receitasPrevistas: number;
  despesasPrevistas: number;
  saldoPrevisto: number;
  saldoAcumulado: number;
};

export type ProjecaoTendencia = "POSITIVA" | "ESTAVEL" | "ATENCAO" | "NEGATIVA";

export type ProjecaoAnalise = {
  tendencia: ProjecaoTendencia;
  riscoSaldoNegativo: boolean;
  mesRiscoSaldoNegativo: string | null;
  economiaMediaMensal: number;
  mensagemPrincipal: string;
  observacoes: string[];
};

export type ProjecaoCenario = {
  nome: string;
  descricao: string;
  saldoFinalProjetado: number;
  diferencaVsAtual: number;
};

export type ProjecaoMeta = {
  nome: string;
  valorAlvo: number;
  valorAtual: number;
  valorRestante: number;
  mesesEstimadosParaConclusao: number | null;
  mensagem: string;
};

export type ProjecoesInteligenteResponse = {
  projecoes: ProjecaoItem[];
  analise: ProjecaoAnalise;
  cenarios: ProjecaoCenario[];
  metas: ProjecaoMeta[];
};

export async function buscarProjecoesInteligentes(
  meses: 3 | 6 | 12 = 6
): Promise<ProjecoesInteligenteResponse> {
  const token = obterToken();
  return apiRequest<ProjecoesInteligenteResponse>(
    `/intelligence/projecoes?meses=${meses}`,
    { method: "GET", token }
  );
}

// ── Score financeiro ──────────────────────────────────────────────────────────

export type ScoreClassificacao = "EXCELENTE" | "BOA" | "ATENCAO" | "CRITICA";

export type ScoreIndicadores = {
  taxaEconomia: number;
  percentualDespesasSobreReceitas: number;
  saldoMedioMensal: number;
  riscoSaldoNegativo: boolean;
  quantidadeAnomalias: number;
  maiorCategoriaDespesa: string | null;
  percentualMaiorCategoria: number;
  metasAtivas: number;
  progressoMedioMetas: number;
};

export type ScoreComponente = {
  nome: string;
  pontuacao: number;
  pontuacaoMaxima: number;
  mensagem: string;
};

export type ScoreFinanceiroResponse = {
  score: number;
  classificacao: ScoreClassificacao;
  mensagemPrincipal: string;
  pontosFortes: string[];
  pontosAtencao: string[];
  indicadores: ScoreIndicadores;
  componentes: ScoreComponente[];
};

export async function buscarScoreFinanceiro(params: {
  mes?: string;
  dataInicial?: string;
  dataFinal?: string;
}): Promise<ScoreFinanceiroResponse> {
  const token = obterToken();
  const query = new URLSearchParams();
  if (params.mes) query.set("mes", params.mes);
  if (params.dataInicial) query.set("dataInicial", params.dataInicial);
  if (params.dataFinal) query.set("dataFinal", params.dataFinal);
  const url = `/intelligence/score-financeiro${query.toString() ? `?${query}` : ""}`;
  return apiRequest<ScoreFinanceiroResponse>(url, { method: "GET", token });
}

// ── Recomendações de economia ─────────────────────────────────────────────────

export type RecomendacaoTipo =
  | "MAIOR_OPORTUNIDADE"
  | "REDUCAO_CATEGORIA"
  | "CATEGORIA_EM_CRESCIMENTO"
  | "CONCENTRACAO_DE_GASTOS"
  | "ECONOMIA_GERAL"
  | "INFORMATIVO";

export type RecomendacaoPrioridade = "ALTA" | "MEDIA" | "BAIXA";

export type RecomendacaoEconomiaItem = {
  tipo: RecomendacaoTipo;
  categoria: string | null;
  titulo: string;
  mensagem: string;
  economiaEstimada: number;
  percentualReducaoSugerido: number;
  percentualDaDespesaTotal: number;
  prioridade: RecomendacaoPrioridade;
};

export type RecomendacaoEconomiaResumo = {
  economiaTotalPotencial: number;
  categoriaComMaiorPotencial: string | null;
  percentualEconomiaSobreDespesas: number;
  mensagemPrincipal: string;
};

export type RecomendacoesEconomiaResponse = {
  recomendacoes: RecomendacaoEconomiaItem[];
  resumo: RecomendacaoEconomiaResumo;
};

export async function buscarRecomendacoesEconomia(params: {
  mes?: string;
  dataInicial?: string;
  dataFinal?: string;
}): Promise<RecomendacoesEconomiaResponse> {
  const token = obterToken();
  const query = new URLSearchParams();
  if (params.mes) query.set("mes", params.mes);
  if (params.dataInicial) query.set("dataInicial", params.dataInicial);
  if (params.dataFinal) query.set("dataFinal", params.dataFinal);
  const url = `/intelligence/economias${query.toString() ? `?${query}` : ""}`;
  return apiRequest<RecomendacoesEconomiaResponse>(url, { method: "GET", token });
}

// ── Aprendizado de categoria ───────────────────────────────────────────────────

export type AprendizadoCategoriaRequest = {
  descricaoOriginal: string;
  tipo: TipoTransacao;
  categoriaId: number;
  categoriaNome: string;
};

export async function registrarAprendizadoCategoria(
  req: AprendizadoCategoriaRequest
): Promise<void> {
  const token = obterToken();
  await apiRequest<unknown>("/intelligence/aprendizado-categoria", {
    method: "POST",
    body: req,
    token,
  });
}

export async function buscarInsights(params: {
  mes?: string;
  dataInicial?: string;
  dataFinal?: string;
}): Promise<InsightsResponse> {
  const token = obterToken();
  const query = new URLSearchParams();
  if (params.mes) query.set("mes", params.mes);
  if (params.dataInicial) query.set("dataInicial", params.dataInicial);
  if (params.dataFinal) query.set("dataFinal", params.dataFinal);
  const url = `/intelligence/insights${query.toString() ? `?${query}` : ""}`;
  return apiRequest<InsightsResponse>(url, { method: "GET", token });
}
