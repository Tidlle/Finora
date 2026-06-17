import { apiRequest } from "./api";
import { obterToken } from "./authService";
import type { TransacaoResponse } from "./transacaoService";

export type DashboardCategoriaResponse = {
  categoria: string;
  valor: number;
  percentual: number;
};

export type DashboardEvolucaoMensalResponse = {
  mes: string;
  receitas: number;
  despesas: number;
};

export type DashboardResumoResponse = {
  mesReferencia: string;
  saldo: number;
  totalReceitas: number;
  totalDespesas: number;
  maiorCategoriaGasto: DashboardCategoriaResponse | null;
  gastosPorCategoria: DashboardCategoriaResponse[];
  ultimasTransacoes: TransacaoResponse[];
  evolucaoMensal: DashboardEvolucaoMensalResponse[];
  variacaoReceitas: number | null;
  variacaoDespesas: number | null;
};

export type FiltrosDashboard = {
  mes?: string;
  dataInicial?: string;
  dataFinal?: string;
  categoriaId?: number;
};

export type ProjecaoMensalResponse = {
  mes: string;
  saldoProjetado: number;
};

export type DashboardProjecaoResponse = {
  saldoEstimadoAtual: number;
  mediaReceitas: number;
  mediaDespesas: number;
  economiaMedia: number;
  maiorCategoriaGasto: string | null;
  projecoes: ProjecaoMensalResponse[];
  alertas: string[];
  dadosInsuficientes: boolean;
};

export async function buscarResumoDashboard(
  filtros: FiltrosDashboard = {}
): Promise<DashboardResumoResponse> {
  const token = obterToken();
  const params = new URLSearchParams();

  if (filtros.mes) params.append("mes", filtros.mes);
  if (filtros.dataInicial) params.append("dataInicial", filtros.dataInicial);
  if (filtros.dataFinal) params.append("dataFinal", filtros.dataFinal);
  if (filtros.categoriaId) params.append("categoriaId", String(filtros.categoriaId));

  const query = params.toString();
  const endpoint = query ? `/dashboard/resumo?${query}` : "/dashboard/resumo";

  return apiRequest<DashboardResumoResponse>(endpoint, { method: "GET", token });
}

export async function buscarProjecao(): Promise<DashboardProjecaoResponse> {
  const token = obterToken();
  return apiRequest<DashboardProjecaoResponse>("/dashboard/projecao", {
    method: "GET",
    token,
  });
}
