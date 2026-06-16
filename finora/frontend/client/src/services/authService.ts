import { apiRequest } from "./api";

export type CadastroRequest = {
  nome: string;
  email: string;
  senha: string;
};

export type CadastroResponse = {
  id: number;
  nome: string;
  email: string;
  categoriasCriadas: number;
  mensagem: string;
};

export type LoginRequest = {
  email: string;
  senha: string;
};

export type LoginResponse = {
  id: number;
  nome: string;
  email: string;
  token: string;
  tipoToken: string;
  expiraEmSegundos: number;
  mensagem: string;
};

export type UsuarioSessao = {
  id: number;
  nome: string;
  email: string;
};

export type PerfilResponse = {
  id: number;
  nome: string;
  email: string;
  criadoEm: string;
};

const TOKEN_KEY = "finora_token";
const USER_KEY = "finora_usuario";

export async function cadastrarUsuario(
  dados: CadastroRequest
): Promise<CadastroResponse> {
  return apiRequest<CadastroResponse>("/auth/cadastro", {
    method: "POST",
    body: dados,
  });
}

export async function fazerLogin(
  dados: LoginRequest
): Promise<LoginResponse> {
  const response = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: dados,
  });

  salvarSessao(response);

  return response;
}

export async function buscarPerfil(): Promise<PerfilResponse> {
  const token = obterToken();

  return apiRequest<PerfilResponse>("/usuarios/perfil", {
    method: "GET",
    token,
  });
}

export function salvarSessao(login: LoginResponse): void {
  localStorage.setItem(TOKEN_KEY, login.token);

  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      id: login.id,
      nome: login.nome,
      email: login.email,
    })
  );
}

export function atualizarUsuarioSalvo(usuario: UsuarioSessao): void {
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

export function obterToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function obterUsuarioSalvo(): UsuarioSessao | null {
  const usuario = localStorage.getItem(USER_KEY);

  if (!usuario) {
    return null;
  }

  try {
    return JSON.parse(usuario) as UsuarioSessao;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function usuarioEstaLogado(): boolean {
  return Boolean(obterToken());
}

export function sair(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
