import type { Category, Goal, Transaction, TransactionType } from "@/types/finance";

export const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrency(value: number) {
  return currency.format(value);
}

export function formatDate(date: string) {
  if (!date) return "—";
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR");
}

export function monthLabel(month: string) {
  if (!month) return "";
  const [year, number] = month.split("-");
  const value = new Date(Number(year), Number(number) - 1, 1);
  return value.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export function transactionTotal(transactions: Transaction[], type: TransactionType) {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + transaction.amount, 0);
}

export function goalProgress(goal: Goal) {
  if (goal.target <= 0) return 0;
  return Math.min(Math.round((goal.current / goal.target) * 100), 100);
}

export function categoryName(categories: Category[], categoryId: string) {
  return categories.find((category) => category.id === categoryId)?.name ?? "Sem categoria";
}

export function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}
