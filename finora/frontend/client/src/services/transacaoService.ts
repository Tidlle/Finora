import { apiRequest } from "./api";
import { obterToken } from "./authService";
import type { TipoTransacao } from "./categoriaService";

export type TransacaoRequest = {
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  dataTransacao: string;
  observacao?: string;
  categoriaId: number;
};

export type TransacaoResponse = {
  id: number;
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  dataTransacao: string;
  observacao: string | null;
  categoriaId: number;
  categoriaNome: string;
  criadoEm: string;
};

export type FiltrosTransacao = {
  tipo?: TipoTransacao;
  categoriaId?: number;
  mes?: string;
  busca?: string;
};

export async function listarTransacoes(
  filtros: FiltrosTransacao = {}
): Promise<TransacaoResponse[]> {
  const token = obterToken();

  const params = new URLSearchParams();

  if (filtros.tipo) {
    params.append("tipo", filtros.tipo);
  }

  if (filtros.categoriaId) {
    params.append("categoriaId", String(filtros.categoriaId));
  }

  if (filtros.mes) {
    params.append("mes", filtros.mes);
  }

  if (filtros.busca) {
    params.append("busca", filtros.busca);
  }

  const query = params.toString();
  const endpoint = query ? `/transacoes?${query}` : "/transacoes";

  return apiRequest<TransacaoResponse[]>(endpoint, {
    method: "GET",
    token,
  });
}

export async function criarTransacao(
  dados: TransacaoRequest
): Promise<TransacaoResponse> {
  const token = obterToken();

  return apiRequest<TransacaoResponse>("/transacoes", {
    method: "POST",
    body: dados,
    token,
  });
}

export async function atualizarTransacao(
  id: number,
  dados: TransacaoRequest
): Promise<TransacaoResponse> {
  const token = obterToken();

  return apiRequest<TransacaoResponse>(`/transacoes/${id}`, {
    method: "PUT",
    body: dados,
    token,
  });
}

export async function excluirTransacao(id: number): Promise<void> {
  const token = obterToken();

  return apiRequest<void>(`/transacoes/${id}`, {
    method: "DELETE",
    token,
  });
}