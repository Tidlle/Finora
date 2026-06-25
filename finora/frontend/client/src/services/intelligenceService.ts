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
