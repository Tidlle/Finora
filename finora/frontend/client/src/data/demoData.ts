import type { Category, Goal, Transaction, UserAccount } from "@/types/finance";

export const DEMO_USER_ID = "demo-user";
export const DEMO_EMAIL = "demo@finora.app";
export const DEMO_PASSWORD = "Finora123";
export const DEMO_PASSWORD_HASH = "9bd61a8b1859dc64e5b7d5a4c9e5e6e9b4a07d01642386de64070d38a02d668e";

export function categoriesForUser(userId: string): Category[] {
  const prefix = userId === DEMO_USER_ID ? "demo" : userId;
  return [
    { id: `${prefix}-alimentacao`, name: "Alimentação", type: "expense", icon: "🍔", isDefault: true, userId },
    { id: `${prefix}-transporte`, name: "Transporte", type: "expense", icon: "🚗", isDefault: true, userId },
    { id: `${prefix}-moradia`, name: "Moradia", type: "expense", icon: "🏠", isDefault: true, userId },
    { id: `${prefix}-educacao`, name: "Educação", type: "expense", icon: "📚", isDefault: true, userId },
    { id: `${prefix}-saude`, name: "Saúde", type: "expense", icon: "🏥", isDefault: true, userId },
    { id: `${prefix}-lazer`, name: "Lazer", type: "expense", icon: "🎬", isDefault: true, userId },
    { id: `${prefix}-assinaturas`, name: "Assinaturas", type: "expense", icon: "📺", isDefault: true, userId },
    { id: `${prefix}-outros-despesa`, name: "Outros", type: "expense", icon: "📌", isDefault: true, userId },
    { id: `${prefix}-salario`, name: "Salário", type: "income", icon: "💼", isDefault: true, userId },
    { id: `${prefix}-freelance`, name: "Freelance", type: "income", icon: "💻", isDefault: true, userId },
    { id: `${prefix}-investimentos`, name: "Investimentos", type: "income", icon: "📈", isDefault: true, userId },
    { id: `${prefix}-presente`, name: "Presente", type: "income", icon: "🎁", isDefault: true, userId },
    { id: `${prefix}-outros-receita`, name: "Outros", type: "income", icon: "✨", isDefault: true, userId },
  ];
}

export const demoUser: UserAccount = {
  id: DEMO_USER_ID,
  fullName: "Eduardo Martins",
  email: DEMO_EMAIL,
  passwordHash: DEMO_PASSWORD_HASH,
  createdAt: "2026-05-26T10:00:00.000Z",
};

export const demoCategories = categoriesForUser(DEMO_USER_ID);

export const demoTransactions: Transaction[] = [
  { id: "tx-1", date: "2026-05-26", description: "Salário mensal", categoryId: "demo-salario", type: "income", amount: 5000, userId: DEMO_USER_ID, createdAt: "2026-05-26T10:00:00.000Z" },
  { id: "tx-2", date: "2026-05-25", description: "Supermercado", categoryId: "demo-alimentacao", type: "expense", amount: 320.5, userId: DEMO_USER_ID, createdAt: "2026-05-25T10:00:00.000Z" },
  { id: "tx-3", date: "2026-05-24", description: "Freelance Design", categoryId: "demo-freelance", type: "income", amount: 850, userId: DEMO_USER_ID, createdAt: "2026-05-24T10:00:00.000Z" },
  { id: "tx-4", date: "2026-05-23", description: "Aluguel", categoryId: "demo-moradia", type: "expense", amount: 950, userId: DEMO_USER_ID, createdAt: "2026-05-23T10:00:00.000Z" },
  { id: "tx-5", date: "2026-05-22", description: "Uber", categoryId: "demo-transporte", type: "expense", amount: 48.9, userId: DEMO_USER_ID, createdAt: "2026-05-22T10:00:00.000Z" },
  { id: "tx-6", date: "2026-05-21", description: "Cinema", categoryId: "demo-lazer", type: "expense", amount: 210, userId: DEMO_USER_ID, createdAt: "2026-05-21T10:00:00.000Z" },
  { id: "tx-7", date: "2026-05-20", description: "Netflix", categoryId: "demo-assinaturas", type: "expense", amount: 39.9, userId: DEMO_USER_ID, createdAt: "2026-05-20T10:00:00.000Z" },
  { id: "tx-8", date: "2026-04-26", description: "Salário mensal", categoryId: "demo-salario", type: "income", amount: 5000, userId: DEMO_USER_ID, createdAt: "2026-04-26T10:00:00.000Z" },
  { id: "tx-9", date: "2026-04-16", description: "Mercado", categoryId: "demo-alimentacao", type: "expense", amount: 237.4, userId: DEMO_USER_ID, createdAt: "2026-04-16T10:00:00.000Z" },
  { id: "tx-10", date: "2026-04-10", description: "Aluguel", categoryId: "demo-moradia", type: "expense", amount: 950, userId: DEMO_USER_ID, createdAt: "2026-04-10T10:00:00.000Z" },
  { id: "tx-11", date: "2026-03-26", description: "Salário mensal", categoryId: "demo-salario", type: "income", amount: 5000, userId: DEMO_USER_ID, createdAt: "2026-03-26T10:00:00.000Z" },
  { id: "tx-12", date: "2026-03-14", description: "Despesas do mês", categoryId: "demo-moradia", type: "expense", amount: 1300, userId: DEMO_USER_ID, createdAt: "2026-03-14T10:00:00.000Z" },
  { id: "tx-13", date: "2026-02-26", description: "Salário mensal", categoryId: "demo-salario", type: "income", amount: 5200, userId: DEMO_USER_ID, createdAt: "2026-02-26T10:00:00.000Z" },
  { id: "tx-14", date: "2026-02-10", description: "Despesas do mês", categoryId: "demo-moradia", type: "expense", amount: 1400, userId: DEMO_USER_ID, createdAt: "2026-02-10T10:00:00.000Z" },
  { id: "tx-15", date: "2026-01-26", description: "Salário mensal", categoryId: "demo-salario", type: "income", amount: 5000, userId: DEMO_USER_ID, createdAt: "2026-01-26T10:00:00.000Z" },
  { id: "tx-16", date: "2026-01-10", description: "Despesas do mês", categoryId: "demo-moradia", type: "expense", amount: 1200, userId: DEMO_USER_ID, createdAt: "2026-01-10T10:00:00.000Z" },
];

export const demoGoals: Goal[] = [
  { id: "goal-1", title: "Comprar notebook", description: "Notebook para estudos e projetos.", current: 1500, target: 5000, deadline: "2026-12-20", userId: DEMO_USER_ID, createdAt: "2026-05-26T10:00:00.000Z" },
  { id: "goal-2", title: "Reserva de emergência", description: "Segurança financeira para imprevistos.", current: 4200, target: 10000, deadline: "2027-06-30", userId: DEMO_USER_ID, createdAt: "2026-05-26T10:00:00.000Z" },
  { id: "goal-3", title: "Viagem", description: "Viagem de férias.", current: 850, target: 3500, deadline: "2027-01-15", userId: DEMO_USER_ID, createdAt: "2026-05-26T10:00:00.000Z" },
];
