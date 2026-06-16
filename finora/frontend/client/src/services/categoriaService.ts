import { apiRequest } from "./api";
import { obterToken } from "./authService";

export type TipoTransacao = "RECEITA" | "DESPESA";

export type CategoriaResponse = {
  id: number;
  nome: string;
  tipo: TipoTransacao;
  padrao: boolean;
  totalTransacoes: number;
  permiteEdicao: boolean;
  permiteExclusao: boolean;
};

export type CategoriaRequest = {
  nome: string;
  tipo: TipoTransacao;
};

export type AtualizarCategoriaRequest = {
  nome: string;
};

export async function listarCategorias(
  tipo?: TipoTransacao
): Promise<CategoriaResponse[]> {
  const token = obterToken();

  const endpoint = tipo
    ? `/categorias?tipo=${tipo}`
    : "/categorias";

  return apiRequest<CategoriaResponse[]>(endpoint, {
    method: "GET",
    token,
  });
}

export async function criarCategoria(
  dados: CategoriaRequest
): Promise<CategoriaResponse> {
  const token = obterToken();

  return apiRequest<CategoriaResponse>("/categorias", {
    method: "POST",
    body: dados,
    token,
  });
}

export async function atualizarCategoria(
  id: number,
  dados: AtualizarCategoriaRequest
): Promise<CategoriaResponse> {
  const token = obterToken();

  return apiRequest<CategoriaResponse>(`/categorias/${id}`, {
    method: "PUT",
    body: dados,
    token,
  });
}

export async function excluirCategoria(id: number): Promise<void> {
  const token = obterToken();

  return apiRequest<void>(`/categorias/${id}`, {
    method: "DELETE",
    token,
  });
}