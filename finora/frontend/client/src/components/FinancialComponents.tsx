import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Pencil, Trash2 } from "lucide-react";

interface FinancialCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: "default" | "income" | "expense" | "neutral";
  className?: string;
}

export function FinancialCard({
  title,
  value,
  subtitle,
  icon,
  variant = "default",
  className = "",
}: FinancialCardProps) {
  const borderClasses = {
    default: "border-border",
    income: "border-green-500/20",
    expense: "border-red-500/20",
    neutral: "border-border",
  };

  const iconBg = {
    default: "bg-accent/10 text-accent",
    income: "bg-green-500/10 text-green-400",
    expense: "bg-red-500/10 text-red-400",
    neutral: "bg-muted text-muted-foreground",
  };

  const valueColor = {
    default: "text-foreground",
    income: "text-green-400",
    expense: "text-red-400",
    neutral: "text-foreground",
  };

  return (
    <Card className={`${borderClasses[variant]} card-hover ${className}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <p className="text-sm font-medium text-muted-foreground leading-tight">{title}</p>
          {icon && (
            <div className={`p-2 rounded-lg shrink-0 ${iconBg[variant]}`}>
              {icon}
            </div>
          )}
        </div>
        <p className={`text-2xl font-display font-bold ${valueColor[variant]} tabular-nums`}>
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1.5 leading-tight">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface GoalProgressCardProps {
  title: string;
  description?: string;
  current: number;
  target: number;
  deadline?: string;
  status?: "in-progress" | "completed" | "paused";
  onEdit?: () => void;
  onDelete?: () => void;
}

export function GoalProgressCard({
  title,
  description,
  current,
  target,
  deadline,
  status = "in-progress",
  onEdit,
  onDelete,
}: GoalProgressCardProps) {
  const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;

  const statusConfig = {
    "in-progress": { label: "Em andamento", cls: "bg-accent/15 text-accent border-accent/20" },
    completed:     { label: "Concluída",    cls: "bg-green-500/15 text-green-400 border-green-500/20" },
    paused:        { label: "Pausada",      cls: "bg-muted text-muted-foreground border-border" },
  };

  const barColor =
    status === "completed" ? "bg-green-400" :
    percentage >= 80       ? "bg-accent" :
                             "bg-accent/70";

  return (
    <Card className="border-border card-hover">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-foreground truncate">{title}</h3>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
            )}
          </div>
          <Badge className={`shrink-0 text-[10px] border ${statusConfig[status].cls}`}>
            {statusConfig[status].label}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-end justify-between text-sm">
            <span className="font-bold text-foreground tabular-nums">
              R$ {current.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-muted-foreground tabular-nums">
              R$ {target.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-xs font-medium text-accent">{percentage}% concluído</p>
        </div>

        {deadline && (
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
            <span>Prazo</span>
            <span className="font-medium text-foreground">{deadline}</span>
          </div>
        )}

        {(onEdit || onDelete) && (
          <div className="flex gap-2 pt-1 border-t border-border">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-accent hover:text-accent hover:bg-accent/10"
                onClick={onEdit}
              >
                <Pencil size={13} /> Editar
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-red-400 hover:text-red-400 hover:bg-red-500/10"
                onClick={onDelete}
              >
                <Trash2 size={13} /> Excluir
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TransactionItemProps {
  date: string;
  description: string;
  category: string;
  type: "income" | "expense";
  amount: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TransactionItem({
  date,
  description,
  category,
  type,
  amount,
  onEdit,
  onDelete,
}: TransactionItemProps) {
  const isIncome = type === "income";

  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors group">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-1.5 h-8 rounded-full shrink-0 ${isIncome ? "bg-green-500" : "bg-red-500"}`} />
        <div className="min-w-0">
          <p className="font-medium text-foreground text-sm truncate">{description}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">{date}</span>
            <span className="text-xs bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">
              {category}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={`font-display font-bold text-sm tabular-nums ${isIncome ? "text-green-400" : "text-red-400"}`}>
          {isIncome ? "+" : "−"} R$ {amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
        {(onEdit || onDelete) && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button onClick={onEdit} className="text-xs text-accent hover:text-accent/80 px-2 py-1 rounded hover:bg-accent/10">
                Editar
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} className="text-xs text-red-400 hover:text-red-500 px-2 py-1 rounded hover:bg-red-500/10">
                Excluir
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
