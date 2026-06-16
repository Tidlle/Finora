/**
 * Componentes Financeiros da Finora
 * Design: Minimalismo Corporativo Sofisticado
 * - Cards financeiros com bordas sutis
 * - Barras de progresso em amarelo
 * - Indicadores de receita/despesa em verde/vermelho
 */

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";

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
  const variantClasses = {
    default: "border-border",
    income: "border-green-500/30 bg-green-500/5",
    expense: "border-red-500/30 bg-red-500/5",
    neutral: "border-border",
  };

  const valueColorClasses = {
    default: "text-foreground",
    income: "text-green-400",
    expense: "text-red-400",
    neutral: "text-foreground",
  };

  return (
    <Card className={`${variantClasses[variant]} ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {icon && <span className="text-muted-foreground">{icon}</span>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <p className={`text-3xl font-display font-bold ${valueColorClasses[variant]}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
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

  const statusColors = {
    "in-progress": "bg-accent/20 text-accent",
    completed: "bg-green-500/20 text-green-400",
    paused: "bg-muted text-muted-foreground",
  };

  return (
    <Card className="border-border hover:border-accent/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <Badge className={statusColors[status]}>{status === "completed" ? "Concluída" : status === "paused" ? "Pausada" : "Em andamento"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              R$ {current.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-sm text-muted-foreground">
              R$ {target.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <Progress value={percentage} className="h-2" />
          <p className="text-xs text-muted-foreground">{percentage}% concluído</p>
        </div>

        {/* Deadline */}
        {deadline && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Prazo:</span>
            <span className="text-foreground font-medium">{deadline}</span>
          </div>
        )}

        {/* Actions */}
        {(onEdit || onDelete) && (
          <div className="flex gap-2 pt-2 border-t border-border">
            {onEdit && (
              <button
                onClick={onEdit}
                className="text-sm text-accent hover:text-accent/80 transition-colors"
              >
                Editar
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="text-sm text-red-400 hover:text-red-500 transition-colors ml-auto"
              >
                Excluir
              </button>
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
  const amountColor = isIncome ? "text-green-400" : "text-red-400";
  const amountSign = isIncome ? "+" : "-";

  return (
    <div className="flex items-center justify-between p-4 border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors">
      <div className="flex-1">
        <p className="font-medium text-foreground">{description}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{date}</span>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
            {category}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className={`font-display font-bold text-lg ${amountColor}`}>
          {amountSign} R$ {amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
        {(onEdit || onDelete) && (
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="text-xs text-accent hover:text-accent/80 transition-colors"
              >
                Editar
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="text-xs text-red-400 hover:text-red-500 transition-colors"
              >
                Excluir
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
