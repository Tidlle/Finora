export type TransactionType = "income" | "expense";

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export type PublicUser = Omit<UserAccount, "passwordHash">;

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  isDefault: boolean;
  userId: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string;
  note?: string;
  userId: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  target: number;
  current: number;
  deadline?: string;
  userId: string;
  createdAt: string;
}
