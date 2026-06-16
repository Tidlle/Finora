import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Edit2, Plus, Tag, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

function IconeCategoria({ tipo }: { tipo: TipoTransacao }) {
  if (tipo === "RECEITA") {
    return <TrendingUp className="w-6 h-6 text-green-400" aria-hidden="true" />;
  }
  return <TrendingDown className="w-6 h-6 text-red-400" aria-hidden="true" />;
}

export default function CategoriesPage() {
  const [categorias, setCategorias] = useState<CategoriaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoriaResponse | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<CategoriaResponse | null>(null);

  const expenseCategories = useMemo(
    () => categorias.filter((category) => category.tipo === "DESPESA"),
    [categorias]
  );

  const incomeCategories = useMemo(
    () => categorias.filter((category) => category.tipo === "RECEITA"),
    [categorias]
  );

  async function carregarCategorias() {
    try {
      setLoading(true);
      setCategorias(await listarCategorias());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar categorias.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarCategorias();
  }, []);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(category: CategoriaResponse) {
    setEditing(category);
    setForm({ nome: category.nome, tipo: category.tipo });
    setDialogOpen(true);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.nome.trim()) {
      toast.error("Informe um nome para a categoria.");
      return;
    }

    try {
      if (editing) {
        await atualizarCategoria(editing.id, { nome: form.nome.trim() });
        toast.success("Categoria atualizada.");
      } else {
        await criarCategoria({ nome: form.nome.trim(), tipo: form.tipo });
        toast.success("Categoria personalizada criada.");
      }
      setDialogOpen(false);
      await carregarCategorias();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar categoria.");
    }
  }

  async function confirmarDelete() {
    if (!deleteTarget) return;
    try {
      await excluirCategoria(deleteTarget.id);
      toast.success("Categoria excluída.");
      await carregarCategorias();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir categoria.");
    } finally {
      setDeleteTarget(null);
    }
  }

  function CategoryGrid({ title, categories }: { title: string; categories: CategoriaResponse[] }) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-heading font-bold text-foreground">{title}</h2>
        {categories.length === 0 ? (
          <Card className="border-border"><CardContent className="p-6 text-sm text-muted-foreground">Nenhuma categoria encontrada.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Card key={category.id} className="border-border">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <IconeCategoria tipo={category.tipo} />
                      <div className="min-w-0">
                        <h3 className="font-heading font-bold text-foreground truncate">{category.nome}</h3>
                        <p className="text-xs text-muted-foreground">{category.totalTransacoes} transações</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{category.padrao ? "Padrão" : "Personalizada"}</Badge>
                  </div>
                  {category.padrao ? (
                    <p className="text-xs text-muted-foreground border-t border-border pt-3">Categoria protegida do sistema.</p>
                  ) : (
                    <TooltipProvider>
                      <div className="flex gap-2 pt-3 border-t border-border">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-accent disabled:opacity-40 disabled:cursor-not-allowed"
                                disabled={!category.permiteEdicao}
                                onClick={() => category.permiteEdicao && openEdit(category)}
                              >
                                <Edit2 />Editar
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {!category.permiteEdicao && (
                            <TooltipContent>
                              <p>Categorias padrão não podem ser alteradas</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-red-400 disabled:opacity-40 disabled:cursor-not-allowed"
                                disabled={!category.permiteExclusao}
                                onClick={() => category.permiteExclusao && setDeleteTarget(category)}
                              >
                                <Trash2 />Excluir
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {!category.permiteExclusao && (
                            <TooltipContent>
                              <p>
                                {category.padrao
                                  ? "Categorias padrão não podem ser alteradas"
                                  : "Categoria com transações não pode ser excluída"}
                              </p>
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
      <Button onClick={openNew}><Plus />Nova categoria</Button>
      {loading && <p className="text-sm text-muted-foreground">Carregando categorias...</p>}
      <CategoryGrid title="Categorias de despesas" categories={expenseCategories} />
      <CategoryGrid title="Categorias de receitas" categories={incomeCategories} />

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
                <select id="type" value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value as TipoTransacao })} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                  <option className="bg-card" value="DESPESA">Despesa</option>
                  <option className="bg-card" value="RECEITA">Receita</option>
                </select>
              </div>
            )}
            <div className="space-y-2"><Label htmlFor="name">Nome</Label><Input id="name" value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} placeholder="Ex.: Pets" /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button type="submit"><Tag />Salvar categoria</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{deleteTarget?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
