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
