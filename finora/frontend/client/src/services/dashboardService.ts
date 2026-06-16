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
};

export async function buscarResumoDashboard(
  mes?: string
): Promise<DashboardResumoResponse> {
  const token = obterToken();

  const endpoint = mes
    ? `/dashboard/resumo?mes=${mes}`
    : "/dashboard/resumo";

  return apiRequest<DashboardResumoResponse>(endpoint, {
    method: "GET",
    token,
  });
}