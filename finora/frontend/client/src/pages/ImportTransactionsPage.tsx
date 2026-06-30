import { useEffect, useRef, useState } from "react";
import {
  Upload, FileText, CheckCircle, AlertCircle, ArrowLeft,
  Sparkles, AlertTriangle, Eye, EyeOff, Info,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/finance";
import { listarCategorias, type CategoriaResponse, type TipoTransacao } from "@/services/categoriaService";
import { criarTransacao } from "@/services/transacaoService";
import {
  normalizarExtrato,
  registrarAprendizadoCategoria,
  type TransacaoBruta,
  type TransacaoNormalizada,
  type ResumoNormalizacao,
} from "@/services/intelligenceService";

// ── Mapeamento de colunas ─────────────────────────────────────────────────────

const MAPA_DATA = ["data", "date", "dt", "lancamento", "lançamento", "data lancamento"];
const MAPA_DESC = ["descricao", "descrição", "historico", "histórico", "description", "memo", "hist"];
const MAPA_VALOR = ["valor", "amount", "value", "quantia", "vlr"];
const MAPA_TIPO = ["tipo", "type"];
const MAPA_CAT = ["categoria", "category", "cat"];

function encontrarColuna(headers: string[], candidatos: string[]): number {
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
  for (const h of headers) {
    const idx = headers.indexOf(h);
    if (candidatos.some((c) => norm(h).includes(norm(c)) || norm(c).includes(norm(h)))) return idx;
  }
  return -1;
}

function detectarDelimitador(conteudo: string): string {
  const pv = (conteudo.match(/;/g) ?? []).length;
  const vg = (conteudo.match(/,/g) ?? []).length;
  return pv >= vg ? ";" : ",";
}

function extrairLinhasBrutas(conteudo: string): TransacaoBruta[] | null {
  const delim = detectarDelimitador(conteudo);
  const linhas = conteudo.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  if (linhas.length < 2) return [];

  const headers = linhas[0].split(delim).map((h) => h.replace(/^"|"$/g, "").trim());
  const iData = encontrarColuna(headers, MAPA_DATA);
  const iDesc = encontrarColuna(headers, MAPA_DESC);
  const iValor = encontrarColuna(headers, MAPA_VALOR);
  const iTipo = encontrarColuna(headers, MAPA_TIPO);
  const iCat = encontrarColuna(headers, MAPA_CAT);

  if (iData === -1 || iDesc === -1 || iValor === -1) return null;

  return linhas.slice(1).map((linha, i) => {
    const cols = linha.split(delim).map((c) => c.replace(/^"|"$/g, "").trim());
    return {
      linha: i + 1,
      dataOriginal: cols[iData] ?? "",
      descricaoOriginal: cols[iDesc] ?? "",
      valorOriginal: cols[iValor] ?? "",
      tipoOriginal: iTipo >= 0 ? (cols[iTipo] ?? "") : "",
      categoriaOriginal: iCat >= 0 ? (cols[iCat] ?? "") : "",
    };
  });
}

// ── Tipos locais ──────────────────────────────────────────────────────────────

type LinhaRevisao = TransacaoNormalizada & {
  // Campos editáveis pelo usuário
  categoriaIdFinal: number | null;
  categoriaIdSugerida: number | null; // para detectar correção
  tipoFinal: TipoTransacao | null;
  valorFinal: number | null;
  dataFinal: string | null;
  selecionada: boolean;
  ignorada: boolean;
};

// ── Helpers visuais ──────────────────────────────────────────────────────────

function statusCor(status: string, ignorada: boolean) {
  if (ignorada) return "opacity-40";
  if (status === "PRONTO") return "border-l-2 border-l-green-500/60";
  if (status === "REVISAR") return "border-l-2 border-l-yellow-500/60";
  if (status === "ERRO") return "border-l-2 border-l-red-500/60";
  return "opacity-30";
}

function statusBadge(status: string) {
  if (status === "PRONTO")
    return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400"><CheckCircle size={10} />Pronto</span>;
  if (status === "REVISAR")
    return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400"><AlertTriangle size={10} />Revisar</span>;
  if (status === "ERRO")
    return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400"><AlertCircle size={10} />Erro</span>;
  return <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">Ignorar</span>;
}

function origemBadge(origem: string) {
  if (origem === "PREFERENCIA_USUARIO")
    return <span className="text-xs text-purple-400 flex items-center gap-1"><Sparkles size={9} />Aprendido</span>;
  if (origem === "REGRA")
    return <span className="text-xs text-primary flex items-center gap-1"><Sparkles size={9} />IA</span>;
  if (origem === "CATEGORIA_ORIGINAL")
    return <span className="text-xs text-blue-400"><FileText size={9} className="inline" /> Arquivo</span>;
  return null;
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function ImportTransactionsPage() {
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [categorias, setCategorias] = useState<CategoriaResponse[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [analisando, setAnalisando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [erroColunas, setErroColunas] = useState(false);
  const [linhas, setLinhas] = useState<LinhaRevisao[]>([]);
  const [resumo, setResumo] = useState<ResumoNormalizacao | null>(null);

  useEffect(() => {
    listarCategorias()
      .then(setCategorias)
      .catch(() => toast.error("Erro ao carregar categorias."))
      .finally(() => setLoadingCategorias(false));
  }, []);

  async function processarArquivo(file: File) {
    setNomeArquivo(file.name);
    setErroColunas(false);
    setLinhas([]);
    setResumo(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const conteudo = (e.target?.result as string) ?? "";
      const brutas = extrairLinhasBrutas(conteudo);

      if (brutas === null) {
        setErroColunas(true);
        return;
      }
      if (brutas.length === 0) {
        toast.error("Nenhuma transação encontrada no arquivo.");
        return;
      }

      setAnalisando(true);
      try {
        const resultado = await normalizarExtrato(brutas);

        const linhasRevisao: LinhaRevisao[] = resultado.transacoesNormalizadas.map((t) => ({
          ...t,
          categoriaIdFinal: t.categoriaSugeridaId,
          categoriaIdSugerida: t.categoriaSugeridaId,
          tipoFinal: t.tipoDetectado as TipoTransacao | null,
          valorFinal: t.valorNormalizado,
          dataFinal: t.dataNormalizada,
          selecionada: t.status !== "ERRO" && t.status !== "IGNORAR",
          ignorada: t.status === "IGNORAR",
        }));

        setLinhas(linhasRevisao);
        setResumo(resultado.resumo);

        const { prontasParaImportar, precisamRevisao, possiveisDuplicadas } = resultado.resumo;
        toast.success(
          `Extrato analisado: ${prontasParaImportar} prontas, ${precisamRevisao} para revisar${possiveisDuplicadas > 0 ? `, ${possiveisDuplicadas} possível(is) duplicata(s)` : ""}.`
        );
      } catch {
        // Fallback: monta revisão manual com dados brutos
        toast.warning("Não foi possível usar a importação inteligente agora. Você ainda pode revisar as linhas manualmente.");
        const fallback: LinhaRevisao[] = brutas.map((b) => ({
          linha: b.linha,
          descricaoOriginal: b.descricaoOriginal,
          descricaoLimpa: b.descricaoOriginal,
          dataOriginal: b.dataOriginal,
          dataNormalizada: null,
          valorOriginal: b.valorOriginal,
          valorNormalizado: null,
          tipoDetectado: null,
          categoriaSugeridaId: null,
          categoriaSugeridaNome: null,
          confianca: 0,
          origemSugestao: "SEM_SUGESTAO",
          possivelDuplicada: false,
          motivoDuplicidade: null,
          status: "REVISAR",
          mensagens: ["Não foi possível normalizar automaticamente. Revise esta linha manualmente."],
          categoriaIdFinal: null,
          categoriaIdSugerida: null,
          tipoFinal: null,
          valorFinal: null,
          dataFinal: null,
          selecionada: true,
          ignorada: false,
        }));
        setLinhas(fallback);
        setResumo({
          totalLinhas: brutas.length,
          prontasParaImportar: 0,
          precisamRevisao: brutas.length,
          possiveisDuplicadas: 0,
          semCategoria: brutas.length,
          comErro: 0,
        });
      } finally {
        setAnalisando(false);
      }
    };
    reader.readAsText(file, "UTF-8");
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processarArquivo(file);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processarArquivo(file);
  }

  function atualizarLinha(linha: number, patch: Partial<LinhaRevisao>) {
    setLinhas((prev) => prev.map((l) => (l.linha === linha ? { ...l, ...patch } : l)));
  }

  function toggleSelecionada(linha: number) {
    setLinhas((prev) =>
      prev.map((l) => (l.linha === linha && !l.ignorada ? { ...l, selecionada: !l.selecionada } : l))
    );
  }

  function toggleIgnorada(linha: number) {
    setLinhas((prev) =>
      prev.map((l) => {
        if (l.linha !== linha) return l;
        const ignorada = !l.ignorada;
        return { ...l, ignorada, selecionada: !ignorada && l.status !== "ERRO" };
      })
    );
  }

  async function confirmarImportacao() {
    const paraImportar = linhas.filter(
      (l) => l.selecionada && !l.ignorada && l.status !== "ERRO" && l.categoriaIdFinal && l.tipoFinal && l.valorFinal && l.dataFinal
    );

    if (paraImportar.length === 0) {
      toast.error("Nenhuma linha válida selecionada para importar.");
      return;
    }

    setImportando(true);
    let sucesso = 0;
    let erros = 0;

    for (const l of paraImportar) {
      try {
        await criarTransacao({
          descricao: l.descricaoLimpa || l.descricaoOriginal,
          valor: l.valorFinal!,
          tipo: l.tipoFinal!,
          categoriaId: l.categoriaIdFinal!,
          dataTransacao: l.dataFinal!,
        });
        sucesso++;
      } catch {
        erros++;
      }
    }

    // Registra aprendizado para categorias corrigidas
    const correcoes = paraImportar.filter(
      (l) => l.categoriaIdSugerida !== null && l.categoriaIdFinal !== l.categoriaIdSugerida
    );
    let aprendizagens = 0;
    for (const l of correcoes) {
      try {
        const cat = categorias.find((c) => c.id === l.categoriaIdFinal);
        await registrarAprendizadoCategoria({
          descricaoOriginal: l.descricaoLimpa || l.descricaoOriginal,
          tipo: l.tipoFinal!,
          categoriaId: l.categoriaIdFinal!,
          categoriaNome: cat?.nome ?? "",
        });
        aprendizagens++;
      } catch {
        // silencioso — não bloqueia
      }
    }

    setImportando(false);

    if (sucesso > 0) toast.success(`${sucesso} transação(ões) importada(s) com sucesso.`);
    if (erros > 0) toast.error(`${erros} transação(ões) falharam.`);
    if (aprendizagens > 0)
      toast.info(`Finora aprendeu ${aprendizagens} preferência(s) com base nas suas correções.`);

    if (sucesso > 0) setLocation("/transactions");
  }

  const selecionadasValidas = linhas.filter(
    (l) => l.selecionada && !l.ignorada && l.status !== "ERRO" && l.categoriaIdFinal && l.tipoFinal && l.valorFinal && l.dataFinal
  );
  const visíveis = linhas.filter((l) => !l.ignorada || l.status === "IGNORAR");

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AppShell
      title="Smart Import"
      subtitle="Importe extratos bancários reais. A Finora Intelligence normaliza descrições, valores e sugere categorias automaticamente."
    >
      <Button variant="outline" size="sm" onClick={() => setLocation("/transactions")}>
        <ArrowLeft size={16} /> Voltar para transações
      </Button>

      {loadingCategorias ? (
        <Skeleton className="h-40 w-full" />
      ) : linhas.length === 0 && !analisando ? (
        <div className="space-y-4">
          {erroColunas && (
            <Card className="border-red-500/40 bg-red-500/10">
              <CardContent className="p-4 text-sm text-red-400">
                <AlertCircle size={14} className="inline mr-2" />
                Não foi possível identificar as colunas do extrato. Verifique se o arquivo possui colunas de <strong>data</strong>, <strong>descrição</strong> e <strong>valor</strong>.
              </CardContent>
            </Card>
          )}

          <Card className="border-border">
            <CardContent className="p-8">
              <div
                className="border-2 border-dashed border-border rounded-lg p-12 text-center space-y-4 cursor-pointer hover:border-accent transition-colors"
                onDrop={onDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => inputRef.current?.click()}
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Upload size={32} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-lg">Arraste seu extrato ou clique para selecionar</p>
                  <p className="text-sm text-muted-foreground mt-1">Suporta extratos bancários, faturas de cartão e qualquer CSV com data, descrição e valor</p>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-primary">
                  <Sparkles size={12} />
                  <span>Finora Intelligence irá normalizar e categorizar automaticamente</span>
                </div>
                <input ref={inputRef} type="file" accept=".csv,.txt" className="hidden" onChange={onFileChange} />
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-secondary/30 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Formato organizado</p>
                  <code className="text-xs text-muted-foreground block">
                    data;descricao;valor;tipo;categoria<br />
                    2026-06-01;UBER TRIP;32.50;DESPESA;<br />
                    2026-06-02;Salário;3500;RECEITA;
                  </code>
                </div>
                <div className="p-4 rounded-lg bg-secondary/30 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Extrato bancário real</p>
                  <code className="text-xs text-muted-foreground block">
                    Data;Histórico;Valor<br />
                    10/06/2026;COMPRA CARTAO 000123 MERCADO EXTRA;-248,90<br />
                    11/06/2026;PIX RECEBIDO EDUARDO;650,00
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : analisando ? (
        <Card className="border-border">
          <CardContent className="p-12 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Sparkles size={24} className="text-primary" />
            </div>
            <p className="font-medium text-foreground">Analisando extrato com Finora Intelligence…</p>
            <p className="text-sm text-muted-foreground">Normalizando descrições, detectando tipos e sugerindo categorias</p>
            <div className="w-48 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: "60%" }} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Header com resumo e ações */}
          <Card className="border-border">
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-muted-foreground" />
                <span className="text-sm font-medium">{nomeArquivo}</span>
              </div>

              {resumo && (
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="text-green-400 flex items-center gap-1">
                    <CheckCircle size={12} />{resumo.prontasParaImportar} prontas
                  </span>
                  {resumo.precisamRevisao > 0 && (
                    <span className="text-yellow-400 flex items-center gap-1">
                      <AlertTriangle size={12} />{resumo.precisamRevisao} revisar
                    </span>
                  )}
                  {resumo.possiveisDuplicadas > 0 && (
                    <span className="text-orange-400 flex items-center gap-1">
                      <Info size={12} />{resumo.possiveisDuplicadas} duplicata(s)
                    </span>
                  )}
                  {resumo.comErro > 0 && (
                    <span className="text-red-400 flex items-center gap-1">
                      <AlertCircle size={12} />{resumo.comErro} erro(s)
                    </span>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setLinhas([]); setNomeArquivo(""); setResumo(null); setErroColunas(false); }}
                >
                  Trocar arquivo
                </Button>
                <Button
                  size="sm"
                  onClick={confirmarImportacao}
                  disabled={importando || selecionadasValidas.length === 0}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {importando ? "Importando…" : `Importar ${selecionadasValidas.length} transação(ões)`}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de revisão */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                Revisão das transações
                <span className="flex items-center gap-1 text-xs font-normal text-primary">
                  <Sparkles size={11} /> Normalizado pela Finora Intelligence
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/20">
                    <th className="px-3 py-2 w-8"></th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Data</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Descrição</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Tipo</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Valor</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Categoria</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground uppercase">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l) => (
                    <tr
                      key={l.linha}
                      className={`border-b border-border transition-opacity ${statusCor(l.status, l.ignorada)}`}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          className="accent-primary"
                          checked={l.selecionada && !l.ignorada}
                          disabled={l.ignorada || l.status === "ERRO" || !l.tipoFinal || !l.valorFinal || !l.dataFinal}
                          onChange={() => toggleSelecionada(l.linha)}
                        />
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-1">
                          {statusBadge(l.status)}
                          {l.possivelDuplicada && (
                            <span className="text-xs text-orange-400 flex items-center gap-1">
                              <Info size={9} />Duplicata?
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Data */}
                      <td className="px-3 py-2">
                        {l.status === "ERRO" && !l.dataNormalizada ? (
                          <input
                            type="date"
                            className="h-7 w-32 rounded border border-input bg-transparent px-2 text-xs text-foreground"
                            value={l.dataFinal ?? ""}
                            onChange={(e) => atualizarLinha(l.linha, { dataFinal: e.target.value, status: e.target.value ? "REVISAR" : "ERRO" })}
                          />
                        ) : (
                          <span className="text-xs">{l.dataFinal ?? <span className="text-red-400">inválida</span>}</span>
                        )}
                      </td>

                      {/* Descrição */}
                      <td className="px-3 py-2 max-w-[200px]">
                        <div className="flex flex-col">
                          <span className="font-medium text-xs leading-tight">{l.descricaoLimpa || l.descricaoOriginal}</span>
                          {l.descricaoLimpa && l.descricaoLimpa !== l.descricaoOriginal && (
                            <span className="text-xs text-muted-foreground/60 truncate" title={l.descricaoOriginal}>
                              orig: {l.descricaoOriginal}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="px-3 py-2">
                        <select
                          value={l.tipoFinal ?? ""}
                          onChange={(e) => {
                            const tipo = e.target.value as TipoTransacao;
                            atualizarLinha(l.linha, {
                              tipoFinal: tipo,
                              categoriaIdFinal: null,
                              status: tipo ? (l.valorFinal && l.dataFinal ? "REVISAR" : l.status) : l.status,
                            });
                          }}
                          className="h-7 rounded border border-input bg-transparent px-1 text-xs text-foreground"
                        >
                          <option value="" className="bg-card">—</option>
                          <option value="DESPESA" className="bg-card">Despesa</option>
                          <option value="RECEITA" className="bg-card">Receita</option>
                        </select>
                      </td>

                      {/* Valor */}
                      <td className="px-3 py-2 text-right">
                        {l.valorFinal != null ? (
                          <span className={`font-semibold text-xs ${l.tipoFinal === "RECEITA" ? "text-green-400" : "text-red-400"}`}>
                            {formatCurrency(l.valorFinal)}
                          </span>
                        ) : (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0,00"
                            className="h-7 w-24 rounded border border-input bg-transparent px-2 text-xs text-right text-foreground"
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (!isNaN(v) && v > 0) {
                                atualizarLinha(l.linha, { valorFinal: v, status: l.dataFinal && l.tipoFinal ? "REVISAR" : l.status });
                              }
                            }}
                          />
                        )}
                        <div className="text-xs text-muted-foreground/60 mt-0.5">{l.valorOriginal}</div>
                      </td>

                      {/* Categoria */}
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-1">
                          <select
                            value={l.categoriaIdFinal ?? ""}
                            onChange={(e) => {
                              const id = e.target.value ? Number(e.target.value) : null;
                              atualizarLinha(l.linha, { categoriaIdFinal: id });
                            }}
                            className="h-7 rounded border border-input bg-transparent px-1 text-xs text-foreground"
                          >
                            <option value="" className="bg-card">Selecione…</option>
                            {categorias
                              .filter((c) => !l.tipoFinal || c.tipo === l.tipoFinal)
                              .map((c) => (
                                <option key={c.id} value={c.id} className="bg-card">{c.nome}</option>
                              ))}
                          </select>
                          {l.categoriaSugeridaId && origemBadge(l.categoriaIdFinal !== l.categoriaIdSugerida ? "CORRIGIDA" : l.origemSugestao)}
                          {l.categoriaIdFinal !== l.categoriaIdSugerida && l.categoriaIdSugerida && (
                            <span className="text-xs text-blue-400">✎ corrigida</span>
                          )}
                        </div>
                      </td>

                      {/* Ação */}
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => toggleIgnorada(l.linha)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title={l.ignorada ? "Restaurar linha" : "Ignorar linha"}
                        >
                          {l.ignorada ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {visíveis.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Todas as linhas foram ignoradas.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legenda */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground px-1">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500/30 inline-block" />Pronto para importar</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-500/30 inline-block" />Precisa de revisão</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500/30 inline-block" />Erro (não será importada sem correção)</span>
            <span className="flex items-center gap-1"><Sparkles size={10} className="text-primary" />Sugestão da IA</span>
            <span className="flex items-center gap-1"><Sparkles size={10} className="text-purple-400" />Categoria aprendida</span>
          </div>
        </div>
      )}
    </AppShell>
  );
}
