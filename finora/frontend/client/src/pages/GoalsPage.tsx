import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Target, CheckCircle, AlertTriangle, Clock, TrendingUp } from "lucide-react";
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
  const diffDias = Math.ceil((dataPrazo.getTime() - hoje.getTime()) / 86400000);
  if (diffDias < 0) return "vencido";
  if (diffDias <= 7) return "proximo";
  return null;
}

function diasRestantes(prazo: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(prazo + "T00:00:00").getTime() - hoje.getTime()) / 86400000);
}

export default function GoalsPage() {
  const [metas, setMetas] = useState<MetaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MetaResponse | null>(null);
  const [form, setForm] = useState<GoalForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<MetaResponse | null>(null);

  const totalAccumulated = metas.reduce((sum, g) => sum + g.valorAcumulado, 0);
  const activeGoals = metas.filter((g) => g.status === "EM_ANDAMENTO");
  const mostAdvanced = useMemo(
    () => [...metas].sort((a, b) => b.progressoPercentual - a.progressoPercentual)[0],
    [metas]
  );

  async function carregarMetas() {
    try {
      setLoading(true);
      setMetas(await listarMetas());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao carregar metas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregarMetas(); }, []);

  function openNew() { setEditing(null); setForm(emptyForm); setDialogOpen(true); }
  function openEdit(goal: MetaResponse) {
    setEditing(goal);
    setForm({ nome: goal.nome, descricao: goal.descricao ?? "", valorObjetivo: String(goal.valorObjetivo), valorAcumulado: String(goal.valorAcumulado), prazo: goal.prazo ?? "" });
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
      const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
      if (new Date(form.prazo + "T00:00:00") < hoje) {
        toast.error("O prazo não pode ser uma data passada."); return;
      }
    }
    try {
      if (editing) {
        await atualizarMeta(editing.id, { nome: form.nome.trim(), descricao: form.descricao.trim() || undefined, valorObjetivo, prazo: form.prazo || undefined });
        await atualizarProgressoMeta(editing.id, { valorAcumulado });
        toast.success("Meta atualizada.");
      } else {
        const m = await criarMeta({ nome: form.nome.trim(), descricao: form.descricao.trim() || undefined, valorObjetivo, prazo: form.prazo || undefined });
        if (valorAcumulado > 0) await atualizarProgressoMeta(m.id, { valorAcumulado });
        toast.success("Meta criada.");
      }
      setDialogOpen(false);
      await carregarMetas();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar meta.");
    }
  }

  async function confirmarDelete() {
    if (!deleteTarget) return;
    try {
      await excluirMeta(deleteTarget.id);
      toast.success("Meta excluída.");
      await carregarMetas();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir meta.");
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <AppShell title="Metas financeiras" subtitle="Acompanhe seu progresso e mantenha o foco nos seus objetivos.">
      <Button onClick={openNew} className="self-start">
        <Plus size={16} /> Criar nova meta
      </Button>

      {/* ── Summary ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total acumulado</p>
            <p className="text-2xl font-display font-bold tabular-nums">{formatCurrency(totalAccumulated)}</p>
          </CardContent>
        </Card>
        <Card className="border-border border-accent/20">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Metas ativas</p>
            <p className="text-2xl font-display font-bold text-accent tabular-nums">{activeGoals.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Mais avançada</p>
            {mostAdvanced ? (
              <>
                <p className="font-display font-bold truncate">{mostAdvanced.nome}</p>
                <p className="text-sm text-accent mt-0.5">{mostAdvanced.progressoPercentual}% concluída</p>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">Nenhuma meta</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Goals list ───────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-3 w-52" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : metas.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-16 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
              <Target size={26} className="text-accent" />
            </div>
            <div>
              <p className="font-heading font-bold text-lg">Nenhuma meta cadastrada</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Crie uma meta financeira para acompanhar seu progresso e manter o foco nos seus objetivos.
              </p>
            </div>
            <Button onClick={openNew}>
              <Plus size={16} /> Criar primeira meta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {metas.map((goal) => {
            const prazoStatus = statusPrazo(goal.prazo, goal.status);
            const dias = goal.prazo ? diasRestantes(goal.prazo) : null;

            return (
              <div key={goal.id} className="space-y-2">
                {/* Status badges */}
                <div className="flex gap-2 flex-wrap empty:hidden">
                  {goal.status === "CONCLUIDA" && (
                    <Badge className="bg-green-500/15 text-green-400 border border-green-500/20 text-[11px]">
                      <CheckCircle size={10} className="mr-1" /> Concluída
                    </Badge>
                  )}
                  {goal.progressoPercentual >= 80 && goal.status !== "CONCLUIDA" && (
                    <Badge className="bg-accent/15 text-accent border border-accent/20 text-[11px]">
                      <TrendingUp size={10} className="mr-1" /> {goal.progressoPercentual}% atingido
                    </Badge>
                  )}
                  {prazoStatus === "vencido" && (
                    <Badge className="bg-red-500/15 text-red-400 border border-red-500/20 text-[11px]">
                      <AlertTriangle size={10} className="mr-1" /> Prazo vencido
                    </Badge>
                  )}
                  {prazoStatus === "proximo" && dias !== null && (
                    <Badge className="bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 text-[11px]">
                      <Clock size={10} className="mr-1" /> {dias} dia(s) restante(s)
                    </Badge>
                  )}
                </div>
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

      {/* ── Dialog ───────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar meta" : "Nova meta"}</DialogTitle>
            <DialogDescription>Defina um objetivo e acompanhe sua evolução financeira.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSave}>
            <div className="space-y-2">
              <Label htmlFor="title">Nome da meta</Label>
              <Input id="title" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Comprar notebook" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Descrição</Label>
              <Textarea id="desc" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Opcional" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target">Valor objetivo</Label>
                <Input id="target" inputMode="decimal" value={form.valorObjetivo} onChange={(e) => setForm({ ...form, valorObjetivo: e.target.value })} placeholder="0,00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current">Valor acumulado</Label>
                <Input id="current" inputMode="decimal" value={form.valorAcumulado} onChange={(e) => setForm({ ...form, valorAcumulado: e.target.value })} placeholder="0,00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Prazo</Label>
              <Input id="deadline" type="date" value={form.prazo} onChange={(e) => setForm({ ...form, prazo: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar meta</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir meta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteTarget?.nome}"? O progresso será perdido.
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
