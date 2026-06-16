const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

function limparSessaoExpirada() {
  localStorage.removeItem("finora_token");
  localStorage.removeItem("finora_usuario");
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401) {
    limparSessaoExpirada();

    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }

    throw new Error("Sua sessão expirou. Faça login novamente.");
  }

  if (!response.ok) {
    let errorMessage = "Erro ao processar a requisição.";

    try {
      const errorData = await response.json();

      if (errorData.mensagem) {
        errorMessage = errorData.mensagem;
      } else if (errorData.erro) {
        errorMessage = errorData.erro;
      } else if (errorData.campos) {
        errorMessage = Object.values(errorData.campos).join(" ");
      }
    } catch {
      errorMessage = `Erro ${response.status}`;
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}