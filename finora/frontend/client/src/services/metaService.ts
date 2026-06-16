import { apiRequest } from "./api";
import { obterToken } from "./authService";

export type StatusMeta = "EM_ANDAMENTO" | "CONCLUIDA";

export type MetaRequest = {
  nome: string;
  descricao?: string;
  valorObjetivo: number;
  prazo?: string;
};

export type AtualizarProgressoMetaRequest = {
  valorAcumulado: number;
};

export type MetaResponse = {
  id: number;
  nome: string;
  descricao: string | null;
  valorObjetivo: number;
  valorAcumulado: number;
  progressoPercentual: number;
  valorRestante: number;
  prazo: string | null;
  status: StatusMeta;
};

export async function listarMetas(
  status?: StatusMeta
): Promise<MetaResponse[]> {
  const token = obterToken();

  const endpoint = status
    ? `/metas?status=${status}`
    : "/metas";

  return apiRequest<MetaResponse[]>(endpoint, {
    method: "GET",
    token,
  });
}

export async function criarMeta(
  dados: MetaRequest
): Promise<MetaResponse> {
  const token = obterToken();

  return apiRequest<MetaResponse>("/metas", {
    method: "POST",
    body: dados,
    token,
  });
}

export async function atualizarMeta(
  id: number,
  dados: MetaRequest
): Promise<MetaResponse> {
  const token = obterToken();

  return apiRequest<MetaResponse>(`/metas/${id}`, {
    method: "PUT",
    body: dados,
    token,
  });
}

export async function atualizarProgressoMeta(
  id: number,
  dados: AtualizarProgressoMetaRequest
): Promise<MetaResponse> {
  const token = obterToken();

  return apiRequest<MetaResponse>(`/metas/${id}/progresso`, {
    method: "PATCH",
    body: dados,
    token,
  });
}

export async function excluirMeta(id: number): Promise<void> {
  const token = obterToken();

  return apiRequest<void>(`/metas/${id}`, {
    method: "DELETE",
    token,
  });
}