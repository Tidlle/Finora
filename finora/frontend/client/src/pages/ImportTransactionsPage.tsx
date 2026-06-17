import { useEffect, useRef, useState } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/finance";
import { listarCategorias, type CategoriaResponse, type TipoTransacao } from "@/services/categoriaService";
import { criarTransacao } from "@/services/transacaoService";

type LinhaImport = {
  index: number;
  data: string;
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  categoriaId: number | null;
  categoriaNome: string;
  selecionada: boolean;
  erro: string | null;
};

function detectarDelimitador(conteudo: string): string {
  const pontoVirgula = (conteudo.match(/;/g) ?? []).length;
  const virgula = (conteudo.match(/,/g) ?? []).length;
  return pontoVirgula >= virgula ? ";" : ",";
}

function parsearValor(str: string): number {
  return Number(str.trim().replace(",", ".").replace(/[^0-9.]/g, ""));
}

function parsearTipo(str: string): TipoTransacao | null {
  const normalizado = str.trim().toUpperCase();
  if (normalizado === "RECEITA" || normalizado === "ENTRADA") return "RECEITA";
  if (normalizado === "DESPESA" || normalizado === "SAÍDA" || normalizado === "SAIDA") return "DESPESA";
  return null;
}

function parsearData(str: string): string | null {
  const partes = str.trim().split(/[-/]/);
  if (partes.length !== 3) return null;
  // Aceita YYYY-MM-DD ou DD/MM/YYYY
  if (partes[0].length === 4) return `${partes[0]}-${partes[1].padStart(2, "0")}-${partes[2].padStart(2, "0")}`;
  return `${partes[2]}-${partes[1].padStart(2, "0")}-${partes[0].padStart(2, "0")}`;
}

export default function ImportTransactionsPage() {
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [categorias, setCategorias] = useState<CategoriaResponse[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [linhas, setLinhas] = useState<LinhaImport[]>([]);
  const [importando, setImportando] = useState(false);
  const [nomeArquivo, setNomeArquivo] = useState("");

  useEffect(() => {
    listarCategorias()
      .then(setCategorias)
      .catch(() => toast.error("Erro ao carregar categorias."))
      .finally(() => setLoadingCategorias(false));
  }, []);

  function encontrarCategoria(nome: string, tipo: TipoTransacao): CategoriaResponse | null {
    return categorias.find(
      (c) => c.tipo === tipo && c.nome.toLowerCase() === nome.trim().toLowerCase()
    ) ?? null;
  }

  function processarArquivo(file: File) {
    setNomeArquivo(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const conteudo = (e.target?.result as string) ?? "";
      const delim = detectarDelimitador(conteudo);
      const linhasRaw = conteudo.replace(/\r/g, "").split("\n").filter(Boolean);

      // Pula cabeçalho se a primeira linha contiver texto não numérico
      const inicio = isNaN(Number(linhasRaw[0]?.split(delim)[0])) ? 1 : 0;
      const dados = linhasRaw.slice(inicio);

      const resultado: LinhaImport[] = dados.map((linha, i) => {
        const colunas = linha.split(delim).map((c) => c.replace(/^"|"$/g, "").trim());

        const dataStr = parsearData(colunas[0] ?? "");
        const descricao = colunas[1] ?? "";
        const valor = parsearValor(colunas[2] ?? "");
        const tipo = parsearTipo(colunas[3] ?? "");
        const categoriaNomeCsv = colunas[4] ?? "";

        const erros: string[] = [];
        if (!dataStr) erros.push("data inválida");
        if (!descricao) erros.push("descrição vazia");
        if (!valor || valor <= 0) erros.push("valor inválido");
        if (!tipo) erros.push("tipo inválido (use RECEITA ou DESPESA)");

        const categoriaEncontrada = tipo ? encontrarCategoria(categoriaNomeCsv, tipo) : null;
        if (!categoriaEncontrada) erros.push(`categoria "${categoriaNomeCsv}" não encontrada`);

        return {
          index: i,
          data: dataStr ?? "",
          descricao,
          valor,
          tipo: tipo ?? "DESPESA",
          categoriaId: categoriaEncontrada?.id ?? null,
          categoriaNome: categoriaNomeCsv,
          selecionada: erros.length === 0,
          erro: erros.length > 0 ? erros.join("; ") : null,
        };
      });

      setLinhas(resultado);
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

  function toggleLinha(index: number) {
    setLinhas((prev) =>
      prev.map((l) => (l.index === index ? { ...l, selecionada: !l.selecionada } : l))
    );
  }

  function setCategoria(index: number, categoriaId: number) {
    setLinhas((prev) =>
      prev.map((l) => {
        if (l.index !== index) return l;
        const cat = categorias.find((c) => c.id === categoriaId);
        return { ...l, categoriaId, categoriaNome: cat?.nome ?? l.categoriaNome, erro: null, selecionada: true };
      })
    );
  }

  async function confirmarImportacao() {
    const selecionadas = linhas.filter((l) => l.selecionada && !l.erro && l.categoriaId);
    if (selecionadas.length === 0) {
      toast.error("Nenhuma linha válida e selecionada para importar.");
      return;
    }

    setImportando(true);
    let sucesso = 0;
    let erros = 0;

    for (const linha of selecionadas) {
      try {
        await criarTransacao({
          descricao: linha.descricao,
          valor: linha.valor,
          tipo: linha.tipo,
          categoriaId: linha.categoriaId!,
          dataTransacao: linha.data,
        });
        sucesso++;
      } catch {
        erros++;
      }
    }

    setImportando(false);

    if (sucesso > 0) toast.success(`${sucesso} transação(ões) importada(s) com sucesso.`);
    if (erros > 0) toast.error(`${erros} transação(ões) falharam ao importar.`);

    if (sucesso > 0) setLocation("/transactions");
  }

  const validas = linhas.filter((l) => !l.erro);
  const comErro = linhas.filter((l) => l.erro);
  const selecionadas = linhas.filter((l) => l.selecionada && !l.erro && l.categoriaId);

  return (
    <AppShell title="Importar transações" subtitle="Faça upload de um arquivo CSV para importar suas movimentações.">
      <Button variant="outline" size="sm" onClick={() => setLocation("/transactions")}>
        <ArrowLeft size={16} /> Voltar para transações
      </Button>

      {loadingCategorias ? (
        <Skeleton className="h-40 w-full" />
      ) : linhas.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-8">
            <div
              className="border-2 border-dashed border-border rounded-lg p-12 text-center space-y-4 cursor-pointer hover:border-accent transition-colors"
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={40} className="mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Arraste um arquivo CSV ou clique para selecionar</p>
                <p className="text-sm text-muted-foreground mt-1">Formato esperado: data;descricao;valor;tipo;categoria</p>
              </div>
              <input ref={inputRef} type="file" accept=".csv,.txt" className="hidden" onChange={onFileChange} />
            </div>

            <div className="mt-6 p-4 rounded-lg bg-secondary/40 space-y-2">
              <p className="text-sm font-medium text-foreground">Exemplo de CSV:</p>
              <code className="text-xs text-muted-foreground block">
                data;descricao;valor;tipo;categoria<br />
                2026-06-10;Mercado;250.00;DESPESA;Alimentação<br />
                2026-06-12;Salário;3500.00;RECEITA;Salário
              </code>
              <p className="text-xs text-muted-foreground">Aceita delimitadores <code>;</code> ou <code>,</code> e valores com vírgula decimal.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="border-border">
            <CardContent className="p-4 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-muted-foreground" />
                <span className="text-sm font-medium">{nomeArquivo}</span>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-green-400"><CheckCircle size={14} className="inline mr-1" />{validas.length} válidas</span>
                {comErro.length > 0 && <span className="text-red-400"><AlertCircle size={14} className="inline mr-1" />{comErro.length} com erro</span>}
                <span className="text-muted-foreground">{selecionadas.length} selecionadas para importar</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setLinhas([]); setNomeArquivo(""); }}>Trocar arquivo</Button>
                <Button size="sm" onClick={confirmarImportacao} disabled={importando || selecionadas.length === 0}>
                  {importando ? "Importando..." : `Importar ${selecionadas.length} transação(ões)`}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader><CardTitle>Prévia das transações</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 w-8"></th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Descrição</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Tipo</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase">Valor</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Categoria</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l) => (
                    <tr key={l.index} className={`border-b border-border ${l.erro ? "opacity-60" : ""} ${l.selecionada ? "" : "opacity-50"}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          className="accent-primary"
                          checked={l.selecionada && !l.erro}
                          disabled={!!l.erro && !l.categoriaId}
                          onChange={() => toggleLinha(l.index)}
                        />
                      </td>
                      <td className="px-4 py-3">{l.data}</td>
                      <td className="px-4 py-3 font-medium">{l.descricao}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded px-2 py-1 text-xs ${l.tipo === "RECEITA" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                          {l.tipo === "RECEITA" ? "Receita" : "Despesa"}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${l.tipo === "RECEITA" ? "text-green-400" : "text-red-400"}`}>
                        {formatCurrency(l.valor)}
                      </td>
                      <td className="px-4 py-3">
                        {l.erro?.includes("categoria") ? (
                          <select
                            value={l.categoriaId ?? ""}
                            onChange={(e) => setCategoria(l.index, Number(e.target.value))}
                            className="h-8 rounded border border-input bg-transparent px-2 text-xs text-foreground"
                          >
                            <option value="" className="bg-card">Selecione…</option>
                            {categorias.filter((c) => c.tipo === l.tipo).map((c) => (
                              <option key={c.id} value={c.id} className="bg-card">{c.nome}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-muted-foreground">{l.categoriaNome}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {l.erro && !l.categoriaId ? (
                          <span className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={12} />{l.erro}</span>
                        ) : (
                          <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle size={12} />OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
