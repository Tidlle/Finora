import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Edit2, Plus, Tag, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  atualizarCategoria,
  criarCategoria,
  excluirCategoria,
  listarCategorias,
  type CategoriaResponse,
  type TipoTransacao,
} from "@/services/categoriaService";

interface CategoryForm {
  nome: string;
  tipo: TipoTransacao;
}

const emptyForm: CategoryForm = { nome: "", tipo: "DESPESA" };

export default function CategoriesPage() {
  const [categorias, setCategorias] = useState<CategoriaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoriaResponse | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<CategoriaResponse | null>(null);

  const despesas = useMemo(() => categorias.filter((c) => c.tipo === "DESPESA"), [categorias]);
  const receitas = useMemo(() => categorias.filter((c) => c.tipo === "RECEITA"), [categorias]);

  async function carregarCategorias() {
    try {
      setLoading(true);
      setCategorias(await listarCategorias());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao carregar categorias.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregarCategorias(); }, []);

  function openNew() { setEditing(null); setForm(emptyForm); setDialogOpen(true); }
  function openEdit(cat: CategoriaResponse) {
    setEditing(cat);
    setForm({ nome: cat.nome, tipo: cat.tipo });
    setDialogOpen(true);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.nome.trim()) { toast.error("Informe um nome para a categoria."); return; }
    try {
      if (editing) {
        await atualizarCategoria(editing.id, { nome: form.nome.trim() });
        toast.success("Categoria atualizada.");
      } else {
        await criarCategoria({ nome: form.nome.trim(), tipo: form.tipo });
        toast.success("Categoria criada.");
      }
      setDialogOpen(false);
      await carregarCategorias();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar categoria.");
    }
  }

  async function confirmarDelete() {
    if (!deleteTarget) return;
    try {
      await excluirCategoria(deleteTarget.id);
      toast.success("Categoria excluída.");
      await carregarCategorias();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir categoria.");
    } finally {
      setDeleteTarget(null);
    }
  }

  function CategorySection({ title, categories, tipo }: { title: string; categories: CategoriaResponse[]; tipo: TipoTransacao }) {
    const isIncome = tipo === "RECEITA";
    const headerColor = isIncome ? "text-green-400" : "text-red-400";
    const headerBg   = isIncome ? "bg-green-500/10" : "bg-red-500/10";
    const borderColor = isIncome ? "border-green-500/15" : "border-red-500/15";

    if (loading) {
      return (
        <section className="space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      );
    }

    return (
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${headerBg} flex items-center justify-center`}>
            {isIncome ? <TrendingUp size={16} className={headerColor} /> : <TrendingDown size={16} className={headerColor} />}
          </div>
          <h2 className={`font-heading font-bold text-base ${headerColor}`}>{title}</h2>
          <Badge variant="secondary" className="text-xs">{categories.length}</Badge>
        </div>

        {categories.length === 0 ? (
          <Card className={`border-dashed ${borderColor}`}>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma categoria de {isIncome ? "receita" : "despesa"} encontrada.</p>
              <Button variant="ghost" size="sm" className="mt-3 text-accent" onClick={openNew}>
                <Plus size={14} /> Criar categoria
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Card key={cat.id} className={`border-border card-hover`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg ${headerBg} flex items-center justify-center shrink-0`}>
                        {isIncome
                          ? <TrendingUp size={15} className={headerColor} />
                          : <TrendingDown size={15} className={headerColor} />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm text-foreground truncate">{cat.nome}</h3>
                        <p className="text-[11px] text-muted-foreground">{cat.totalTransacoes} transação(ões)</p>
                      </div>
                    </div>
                    {cat.padrao && (
                      <Badge variant="secondary" className="text-[10px] shrink-0">Padrão</Badge>
                    )}
                  </div>

                  {cat.padrao ? (
                    <p className="text-[11px] text-muted-foreground border-t border-border pt-2.5">
                      Categoria protegida do sistema.
                    </p>
                  ) : (
                    <TooltipProvider>
                      <div className="flex gap-1.5 pt-2.5 border-t border-border">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex-1">
                              <Button
                                variant="ghost" size="sm"
                                className="w-full text-accent hover:text-accent hover:bg-accent/10 disabled:opacity-40"
                                disabled={!cat.permiteEdicao}
                                onClick={() => cat.permiteEdicao && openEdit(cat)}
                              >
                                <Edit2 size={13} /> Editar
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {!cat.permiteEdicao && <TooltipContent><p>Categorias padrão não podem ser alteradas</p></TooltipContent>}
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex-1">
                              <Button
                                variant="ghost" size="sm"
                                className="w-full text-red-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-40"
                                disabled={!cat.permiteExclusao}
                                onClick={() => cat.permiteExclusao && setDeleteTarget(cat)}
                              >
                                <Trash2 size={13} /> Excluir
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {!cat.permiteExclusao && (
                            <TooltipContent>
                              <p>{cat.padrao ? "Categorias padrão não podem ser alteradas" : "Categoria com transações não pode ser excluída"}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <AppShell title="Categorias" subtitle="Organize suas receitas e despesas do seu jeito.">
      <div className="flex items-center justify-between">
        <Button onClick={openNew}>
          <Plus size={16} /> Nova categoria
        </Button>
        <div className="text-xs text-muted-foreground hidden sm:block">
          {categorias.length} categoria(s) no total
        </div>
      </div>

      <CategorySection title="Despesas" categories={despesas} tipo="DESPESA" />
      <CategorySection title="Receitas" categories={receitas} tipo="RECEITA" />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar categoria" : "Nova categoria"}</DialogTitle>
            <DialogDescription>Categorias personalizadas ajudam a organizar suas movimentações.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSave}>
            {!editing && (
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["DESPESA", "RECEITA"] as TipoTransacao[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, tipo: t })}
                      className={`h-10 rounded-md border text-sm font-medium transition-colors ${
                        form.tipo === t
                          ? t === "RECEITA" ? "border-green-500 bg-green-500/10 text-green-400" : "border-red-500 bg-red-500/10 text-red-400"
                          : "border-border text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {t === "RECEITA" ? "Receita" : "Despesa"}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Nome da categoria</Label>
              <Input id="name" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Pets, Academia, Streaming..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit"><Tag size={15} /> Salvar categoria</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteTarget?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
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
