import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Search, Pencil, Trash2, Receipt, Download, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/finance";
import { listarCategorias, type CategoriaResponse, type TipoTransacao } from "@/services/categoriaService";
import {
  atualizarTransacao,
  criarTransacao,
  excluirTransacao,
  listarTransacoes,
  type TransacaoResponse,
} from "@/services/transacaoService";

interface TransactionForm {
  descricao: string;
  valor: string;
  tipo: TipoTransacao;
  categoriaId: string;
  dataTransacao: string;
  observacao: string;
  recorrente: boolean;
  mesesRecorrencia: number;
}

function mesAtualPadrao() {
  const data = new Date();
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function dataAtualPadrao() {
  return new Date().toISOString().slice(0, 10);
}

const emptyForm: TransactionForm = {
  descricao: "",
  valor: "",
  tipo: "DESPESA",
  categoriaId: "",
  dataTransacao: dataAtualPadrao(),
  observacao: "",
  recorrente: false,
  mesesRecorrencia: 3,
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function TransactionsPage() {
  const [, setLocation] = useLocation();
  const [transactions, setTransactions] = useState<TransacaoResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [categories, setCategories] = useState<CategoriaResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [month, setMonth] = useState(mesAtualPadrao());
  const [typeFilter, setTypeFilter] = useState<"all" | TipoTransacao>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TransacaoResponse | null>(null);
  const [form, setForm] = useState<TransactionForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<TransacaoResponse | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const availableCategories = useMemo(
    () => categories.filter((c) => c.tipo === form.tipo),
    [categories, form.tipo]
  );

  const filtros = useMemo(() => ({
    tipo: typeFilter === "all" ? undefined : typeFilter,
    categoriaId: categoryFilter === "all" ? undefined : Number(categoryFilter),
    mes: month || undefined,
    busca: searchTerm.trim() || undefined,
    page: currentPage,
    size: pageSize,
  }), [typeFilter, categoryFilter, month, searchTerm, currentPage, pageSize]);

  const filtrosAtivos = typeFilter !== "all" || categoryFilter !== "all" || !!searchTerm.trim();

  async function carregarCategorias() {
    const resposta = await listarCategorias();
    setCategories(resposta);
    return resposta;
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds(selectedIds.size === transactions.length ? new Set() : new Set(transactions.map((t) => t.id)));
  }

  async function confirmarBulkDelete() {
    try {
      await Promise.all([...selectedIds].map((id) => excluirTransacao(id)));
      toast.success(`${selectedIds.size} transação(ões) excluída(s).`);
      setSelectedIds(new Set());
      await carregarTransacoes();
      carregarCategorias().catch(() => {});
    } catch {
      toast.error("Erro ao excluir transações selecionadas.");
    } finally {
      setBulkDeleteOpen(false);
    }
  }

  function exportarCSV() {
    const linhas = [
      ["Data", "Descrição", "Categoria", "Tipo", "Valor", "Observação"],
      ...transactions.map((t) => [
        t.dataTransacao,
        `"${t.descricao.replace(/"/g, '""')}"`,
        t.categoriaNome,
        t.tipo,
        String(t.valor),
        `"${(t.observacao ?? "").replace(/"/g, '""')}"`,
      ]),
    ];
    const csv = linhas.map((l) => l.join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `finora-transacoes-${month}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function carregarTransacoes() {
    try {
      setLoading(true);
      const resultado = await listarTransacoes(filtros);
      setTransactions(resultado.content);
      setTotalElements(resultado.totalElements);
      setTotalPages(resultado.totalPages);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar transações.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarCategorias().catch((e) => {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar categorias.");
    });
  }, []);

  useEffect(() => {
    carregarTransacoes();
  }, [filtros]);

  // Reset page when filters change (except page itself)
  useEffect(() => {
    setCurrentPage(0);
    setSelectedIds(new Set());
  }, [typeFilter, categoryFilter, month, searchTerm, pageSize]);

  function primeiraCategoriaDoTipo(tipo: TipoTransacao) {
    return categories.find((c) => c.tipo === tipo)?.id.toString() ?? "";
  }

  function openNew(tipo: TipoTransacao) {
    setEditing(null);
    setForm({ ...emptyForm, tipo, categoriaId: primeiraCategoriaDoTipo(tipo) });
    setDialogOpen(true);
  }

  function openEdit(transaction: TransacaoResponse) {
    setEditing(transaction);
    setForm({
      descricao: transaction.descricao,
      valor: String(transaction.valor),
      tipo: transaction.tipo,
      categoriaId: String(transaction.categoriaId),
      dataTransacao: transaction.dataTransacao,
      observacao: transaction.observacao ?? "",
      recorrente: false,
      mesesRecorrencia: 3,
    });
    setDialogOpen(true);
  }

  function setType(tipo: TipoTransacao) {
    setForm((prev) => ({ ...prev, tipo, categoriaId: primeiraCategoriaDoTipo(tipo) }));
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const valor = Number(form.valor.replace(",", "."));

    if (!form.descricao.trim() || !form.categoriaId || !form.dataTransacao) {
      toast.error("Preencha descrição, categoria e data corretamente.");
      return;
    }
    if (!valor || valor <= 0) {
      toast.error("O valor deve ser maior que zero.");
      return;
    }

    const basePayload = {
      descricao: form.descricao.trim(),
      valor,
      tipo: form.tipo,
      categoriaId: Number(form.categoriaId),
      dataTransacao: form.dataTransacao,
      observacao: form.observacao.trim() || undefined,
    };

    try {
      if (editing) {
        await atualizarTransacao(editing.id, basePayload);
        toast.success("Transação atualizada.");
      } else if (form.recorrente && form.mesesRecorrencia > 1) {
        const [ano, mes, dia] = form.dataTransacao.split("-").map(Number);
        const payloads = Array.from({ length: form.mesesRecorrencia }, (_, i) => {
          const data = new Date(ano, mes - 1 + i, dia);
          const m = String(data.getMonth() + 1).padStart(2, "0");
          const d = String(data.getDate()).padStart(2, "0");
          return { ...basePayload, dataTransacao: `${data.getFullYear()}-${m}-${d}` };
        });
        await Promise.all(payloads.map((p) => criarTransacao(p)));
        toast.success(`${form.mesesRecorrencia} transações recorrentes criadas.`);
      } else {
        await criarTransacao(basePayload);
        toast.success("Transação adicionada.");
      }
      setDialogOpen(false);
      await carregarTransacoes();
      carregarCategorias().catch(() => {});
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar transação.");
    }
  }

  async function confirmarDelete() {
    if (!deleteTarget) return;
    try {
      await excluirTransacao(deleteTarget.id);
      toast.success("Transação excluída.");
      await carregarTransacoes();
      carregarCategorias().catch(() => {});
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir transação.");
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <AppShell title="Transações" subtitle="Gerencie todas as suas movimentações financeiras.">
      <div className="flex gap-3 flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3 flex-wrap">
          <Button onClick={() => openNew("RECEITA")} className="bg-green-600 text-white hover:bg-green-700"><Plus size={18} />Nova receita</Button>
          <Button onClick={() => openNew("DESPESA")}><Plus size={18} />Nova despesa</Button>
          <Button variant="outline" onClick={() => setLocation("/import")}><Upload size={18} />Importar CSV</Button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selectedIds.size > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 size={15} /> Excluir {selectedIds.size} selecionada(s)
            </Button>
          )}
          {transactions.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportarCSV}>
              <Download size={15} /> Exportar CSV
            </Button>
          )}
        </div>
      </div>

      <Card className="border-border">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar transação..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Input aria-label="Filtrar por mês" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as "all" | TipoTransacao)} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm text-foreground">
            <option value="all" className="bg-card">Todos os tipos</option>
            <option value="RECEITA" className="bg-card">Receitas</option>
            <option value="DESPESA" className="bg-card">Despesas</option>
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm text-foreground">
            <option value="all" className="bg-card">Todas as categorias</option>
            {categories.map((c) => <option key={c.id} value={c.id} className="bg-card">{c.nome}</option>)}
          </select>
        </CardContent>
      </Card>

      {loading ? (
        <>
          <Card className="hidden md:block border-border">
            <CardContent className="p-0">
              <table className="w-full">
                <thead><tr className="border-b border-border">{["", "Data", "Descrição", "Categoria", "Tipo", "Valor", "Ações"].map((h) => (<th key={h} className="px-5 py-3 text-left"><Skeleton className="h-3 w-16" /></th>))}</tr></thead>
                <tbody>{Array.from({ length: 5 }).map((_, i) => (<tr key={i} className="border-b border-border"><td className="px-4 py-4"><Skeleton className="h-4 w-4" /></td><td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td><td className="px-5 py-4"><Skeleton className="h-4 w-40" /></td><td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td><td className="px-5 py-4"><Skeleton className="h-5 w-16 rounded" /></td><td className="px-5 py-4"><Skeleton className="h-4 w-20 ml-auto" /></td><td className="px-5 py-4"><Skeleton className="h-7 w-16" /></td></tr>))}</tbody>
              </table>
            </CardContent>
          </Card>
          <div className="md:hidden space-y-3">{Array.from({ length: 3 }).map((_, i) => (<Card key={i} className="border-border"><CardContent className="p-4 space-y-3"><div className="flex justify-between gap-3"><div className="space-y-2 flex-1"><Skeleton className="h-4 w-36" /><Skeleton className="h-3 w-28" /></div><Skeleton className="h-5 w-20" /></div><div className="flex justify-end gap-2"><Skeleton className="h-8 w-20" /><Skeleton className="h-8 w-20" /></div></CardContent></Card>))}</div>
        </>
      ) : transactions.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-12 text-center">
            <Receipt size={42} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {filtrosAtivos
                ? "Nenhuma transação encontrada para os filtros selecionados."
                : "Você ainda não tem transações. Comece adicionando uma receita ou despesa."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="hidden md:block border-border">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-border">
                  <th className="px-4 py-3 w-8"><input type="checkbox" className="accent-primary" checked={selectedIds.size === transactions.length && transactions.length > 0} onChange={toggleSelectAll} aria-label="Selecionar todos" /></th>
                  {["Data", "Descrição", "Categoria", "Tipo", "Valor", "Ações"].map((h) => <th key={h} className={`px-5 py-3 text-xs font-heading font-bold text-muted-foreground uppercase ${h === "Valor" ? "text-right" : "text-left"}`}>{h}</th>)}
                </tr></thead>
                <tbody>{transactions.map((t) => (
                  <tr key={t.id} className={`border-b border-border hover:bg-secondary/30 transition-colors ${selectedIds.has(t.id) ? "bg-secondary/20" : ""}`}>
                    <td className="px-4 py-4"><input type="checkbox" className="accent-primary" checked={selectedIds.has(t.id)} onChange={() => toggleSelect(t.id)} /></td>
                    <td className="px-5 py-4 text-sm">{formatDate(t.dataTransacao)}</td>
                    <td className="px-5 py-4 text-sm font-medium">{t.descricao}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{t.categoriaNome}</td>
                    <td className="px-5 py-4"><span className={`rounded px-2 py-1 text-xs ${t.tipo === "RECEITA" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{t.tipo === "RECEITA" ? "Receita" : "Despesa"}</span></td>
                    <td className={`px-5 py-4 text-sm font-bold text-right ${t.tipo === "RECEITA" ? "text-green-400" : "text-red-400"}`}>{t.tipo === "RECEITA" ? "+" : "-"} {formatCurrency(t.valor)}</td>
                    <td className="px-5 py-4"><div className="flex gap-2"><Button variant="ghost" size="icon-sm" onClick={() => openEdit(t)} aria-label="Editar"><Pencil /></Button><Button variant="ghost" size="icon-sm" className="text-red-400" onClick={() => setDeleteTarget(t)} aria-label="Excluir"><Trash2 /></Button></div></td>
                  </tr>
                ))}</tbody>
              </table>
            </CardContent>
          </Card>

          <div className="md:hidden space-y-3">
            {transactions.map((t) => (
              <Card key={t.id} className={`border-border ${selectedIds.has(t.id) ? "ring-1 ring-primary" : ""}`}><CardContent className="p-4 space-y-3">
                <div className="flex justify-between gap-3">
                  <div className="flex items-start gap-3"><input type="checkbox" className="accent-primary mt-1" checked={selectedIds.has(t.id)} onChange={() => toggleSelect(t.id)} /><div><p className="font-medium">{t.descricao}</p><p className="text-xs text-muted-foreground">{formatDate(t.dataTransacao)} • {t.categoriaNome}</p></div></div>
                  <p className={`font-bold shrink-0 ${t.tipo === "RECEITA" ? "text-green-400" : "text-red-400"}`}>{t.tipo === "RECEITA" ? "+" : "-"} {formatCurrency(t.valor)}</p>
                </div>
                <div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => openEdit(t)}><Pencil /> Editar</Button><Button variant="ghost" size="sm" className="text-red-400" onClick={() => setDeleteTarget(t)}><Trash2 /> Excluir</Button></div>
              </CardContent></Card>
            ))}
          </div>

          {/* Paginação */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{totalElements} transação(ões) total</span>
              <span>·</span>
              <span>Página {currentPage + 1} de {Math.max(1, totalPages)}</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="ml-2 h-8 rounded border border-input bg-transparent px-2 text-xs text-foreground"
              >
                {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s} className="bg-card">{s} por página</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft size={16} /> Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Próxima <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar transação" : "Nova transação"}</DialogTitle>
            <DialogDescription>Registre uma entrada ou saída no seu controle financeiro.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant={form.tipo === "RECEITA" ? "default" : "outline"} className={form.tipo === "RECEITA" ? "bg-green-600 text-white hover:bg-green-700" : ""} onClick={() => setType("RECEITA")}>Receita</Button>
              <Button type="button" variant={form.tipo === "DESPESA" ? "default" : "outline"} onClick={() => setType("DESPESA")}>Despesa</Button>
            </div>
            <div className="space-y-2"><Label htmlFor="description">Descrição</Label><Input id="description" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex.: Supermercado" /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="amount">Valor</Label><Input id="amount" inputMode="decimal" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0,00" /></div>
              <div className="space-y-2"><Label htmlFor="date">Data</Label><Input id="date" type="date" value={form.dataTransacao} onChange={(e) => setForm({ ...form, dataTransacao: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="category">Categoria</Label><select id="category" value={form.categoriaId} onChange={(e) => setForm({ ...form, categoriaId: e.target.value })} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground">{availableCategories.map((c) => <option key={c.id} value={c.id} className="bg-card">{c.nome}</option>)}</select></div>
            <div className="space-y-2"><Label htmlFor="note">Observação</Label><Textarea id="note" value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} placeholder="Opcional" /></div>
            {!editing && (
              <div className="space-y-3 rounded-md border border-border p-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="accent-primary" checked={form.recorrente} onChange={(e) => setForm({ ...form, recorrente: e.target.checked })} />
                  <span className="text-sm font-medium">Repetir mensalmente</span>
                </label>
                {form.recorrente && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="meses" className="text-sm whitespace-nowrap">Por quantos meses?</Label>
                    <Input id="meses" type="number" min={2} max={24} value={form.mesesRecorrencia} onChange={(e) => setForm({ ...form, mesesRecorrencia: Math.min(24, Math.max(2, Number(e.target.value))) })} className="w-20" />
                  </div>
                )}
              </div>
            )}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button type="submit">Salvar transação</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transações selecionadas</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir {selectedIds.size} transação(ões)? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarBulkDelete} className="bg-red-600 hover:bg-red-700 text-white">Excluir todas</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transação</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarDelete} className="bg-red-600 hover:bg-red-700 text-white">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
