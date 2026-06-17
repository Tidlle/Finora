import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Target, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { GoalProgressCard } from "@/components/FinancialComponents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/finance";
import {
  atualizarMeta,
  atualizarProgressoMeta,
  criarMeta,
  excluirMeta,
  listarMetas,
  type MetaResponse,
} from "@/services/metaService";

interface GoalForm {
  nome: string;
  descricao: string;
  valorObjetivo: string;
  valorAcumulado: string;
  prazo: string;
}

const emptyForm: GoalForm = { nome: "", descricao: "", valorObjetivo: "", valorAcumulado: "0", prazo: "" };

function statusPrazo(prazo: string | null | undefined, status: string): "proximo" | "vencido" | null {
  if (!prazo || status === "CONCLUIDA") return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataPrazo = new Date(prazo + "T00:00:00");
  const diffMs = dataPrazo.getTime() - hoje.getTime();
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDias < 0) return "vencido";
  if (diffDias <= 7) return "proximo";
  return null;
}

export default function GoalsPage() {
  const [metas, setMetas] = useState<MetaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MetaResponse | null>(null);
  const [form, setForm] = useState<GoalForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<MetaResponse | null>(null);

  const totalAccumulated = metas.reduce((sum, goal) => sum + goal.valorAcumulado, 0);
  const activeGoals = metas.filter((goal) => goal.status === "EM_ANDAMENTO");
  const mostAdvanced = useMemo(() => [...metas].sort((a, b) => b.progressoPercentual - a.progressoPercentual)[0], [metas]);

  async function carregarMetas() {
    try {
      setLoading(true);
      setMetas(await listarMetas());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar metas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarMetas();
  }, []);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(goal: MetaResponse) {
    setEditing(goal);
    setForm({
      nome: goal.nome,
      descricao: goal.descricao ?? "",
      valorObjetivo: String(goal.valorObjetivo),
      valorAcumulado: String(goal.valorAcumulado),
      prazo: goal.prazo ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const valorObjetivo = Number(form.valorObjetivo.replace(",", "."));
    const valorAcumulado = Number(form.valorAcumulado.replace(",", "."));

    if (!form.nome.trim() || !valorObjetivo || valorObjetivo <= 0 || Number.isNaN(valorAcumulado) || valorAcumulado < 0) {
      toast.error("Informe nome, objetivo maior que zero e valor acumulado válido.");
      return;
    }

    if (form.prazo) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const dataPrazo = new Date(form.prazo + "T00:00:00");
      if (dataPrazo < hoje) {
        toast.error("O prazo não pode ser uma data passada.");
        return;
      }
    }

    try {
      if (editing) {
        await atualizarMeta(editing.id, {
          nome: form.nome.trim(),
          descricao: form.descricao.trim() || undefined,
          valorObjetivo,
          prazo: form.prazo || undefined,
        });
        await atualizarProgressoMeta(editing.id, { valorAcumulado });
        toast.success("Meta atualizada.");
      } else {
        const metaCriada = await criarMeta({
          nome: form.nome.trim(),
          descricao: form.descricao.trim() || undefined,
          valorObjetivo,
          prazo: form.prazo || undefined,
        });
        if (valorAcumulado > 0) {
          await atualizarProgressoMeta(metaCriada.id, { valorAcumulado });
        }
        toast.success("Meta criada.");
      }
      setDialogOpen(false);
      await carregarMetas();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar meta.");
    }
  }

  async function confirmarDelete() {
    if (!deleteTarget) return;
    try {
      await excluirMeta(deleteTarget.id);
      toast.success("Meta excluída.");
      await carregarMetas();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir meta.");
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <AppShell title="Metas financeiras" subtitle="Acompanhe seu progresso e mantenha o foco nos seus objetivos.">
      <Button onClick={openNew}><Plus />Criar nova meta</Button>

      <Card className="border-border bg-secondary/30">
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div><p className="text-sm text-muted-foreground uppercase tracking-wider">Total acumulado</p><p className="text-3xl font-display font-bold mt-2">{formatCurrency(totalAccumulated)}</p></div>
          <div><p className="text-sm text-muted-foreground uppercase tracking-wider">Metas ativas</p><p className="text-3xl font-display font-bold text-accent mt-2">{activeGoals.length}</p></div>
          <div><p className="text-sm text-muted-foreground uppercase tracking-wider">Mais avançada</p><p className="text-lg font-display font-bold mt-2">{mostAdvanced?.nome ?? "Nenhuma"}</p>{mostAdvanced && <p className="text-sm text-accent">{mostAdvanced.progressoPercentual}% concluída</p>}</div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : metas.length === 0 ? (
        <Card className="border-border"><CardContent className="p-12 text-center"><Target size={48} className="mx-auto text-muted-foreground mb-4" /><p className="text-lg text-muted-foreground mb-4">Crie sua primeira meta financeira.</p><Button onClick={openNew}><Plus />Criar meta</Button></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {metas.map((goal) => {
            const prazoStatus = statusPrazo(goal.prazo, goal.status);
            return (
              <div key={goal.id} className="space-y-2">
                {(prazoStatus || goal.status === "CONCLUIDA" || goal.progressoPercentual >= 80) && (
                  <div className="flex gap-2 flex-wrap">
                    {goal.status === "CONCLUIDA" && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <CheckCircle size={11} className="mr-1" />Meta concluída
                      </Badge>
                    )}
                    {goal.progressoPercentual >= 80 && goal.status !== "CONCLUIDA" && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        {goal.progressoPercentual}% concluída
                      </Badge>
                    )}
                    {prazoStatus === "vencido" && (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Prazo vencido</Badge>
                    )}
                    {prazoStatus === "proximo" && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Prazo próximo</Badge>
                    )}
                  </div>
                )}
                <GoalProgressCard
                  title={goal.nome}
                  description={goal.descricao ?? undefined}
                  current={goal.valorAcumulado}
                  target={goal.valorObjetivo}
                  deadline={goal.prazo ? formatDate(goal.prazo) : undefined}
                  status={goal.status === "CONCLUIDA" ? "completed" : "in-progress"}
                  onEdit={() => openEdit(goal)}
                  onDelete={() => setDeleteTarget(goal)}
                />
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar meta" : "Nova meta"}</DialogTitle><DialogDescription>Defina um objetivo e acompanhe sua evolução.</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={handleSave}>
            <div className="space-y-2"><Label htmlFor="title">Nome da meta</Label><Input id="title" value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} placeholder="Ex.: Comprar notebook" /></div>
            <div className="space-y-2"><Label htmlFor="description">Descrição</Label><Textarea id="description" value={form.descricao} onChange={(event) => setForm({ ...form, descricao: event.target.value })} placeholder="Opcional" /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="target">Valor objetivo</Label><Input id="target" inputMode="decimal" value={form.valorObjetivo} onChange={(event) => setForm({ ...form, valorObjetivo: event.target.value })} placeholder="0,00" /></div>
              <div className="space-y-2"><Label htmlFor="current">Valor acumulado</Label><Input id="current" inputMode="decimal" value={form.valorAcumulado} onChange={(event) => setForm({ ...form, valorAcumulado: event.target.value })} placeholder="0,00" /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="deadline">Prazo</Label><Input id="deadline" type="date" value={form.prazo} onChange={(event) => setForm({ ...form, prazo: event.target.value })} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button type="submit">Salvar meta</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir meta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a meta "{deleteTarget?.nome}"? O progresso registrado será perdido.
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
