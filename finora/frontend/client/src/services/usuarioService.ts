import { apiRequest } from "./api";
import { obterToken } from "./authService";

export type PerfilResponse = {
  id: number;
  nome: string;
  email: string;
  criadoEm: string;
};

export type AtualizarPerfilRequest = {
  nome: string;
  email: string;
};

export type AlterarSenhaRequest = {
  senhaAtual: string;
  novaSenha: string;
};

export async function obterPerfil(): Promise<PerfilResponse> {
  const token = obterToken();

  return apiRequest<PerfilResponse>("/usuarios/perfil", {
    method: "GET",
    token,
  });
}

export async function atualizarPerfil(
  dados: AtualizarPerfilRequest
): Promise<PerfilResponse> {
  const token = obterToken();

  return apiRequest<PerfilResponse>("/usuarios/perfil", {
    method: "PUT",
    body: dados,
    token,
  });
}

export async function alterarSenha(
  dados: AlterarSenhaRequest
): Promise<void> {
  const token = obterToken();

  return apiRequest<void>("/usuarios/senha", {
    method: "PUT",
    body: dados,
    token,
  });
}