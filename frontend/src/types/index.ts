export type UUID = string;

export type AccountType = 'cash' | 'bank' | 'card' | 'savings' | 'other';
export type EntryType = 'income' | 'expense';

export interface User {
  id: UUID;
  email: string;
  fullName: string;
  createdAt: string;
}

export interface Account {
  id: UUID;
  name: string;
  type: AccountType;
  currentBalance: number;
  initialBalance: number;
  currency: string;
  color: string;
  icon: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: UUID;
  name: string;
  type: EntryType;
  color: string;
  icon: string;
  parentId: UUID | null;
  isArchived: boolean;
}

export interface MiniRef {
  id: UUID;
  name: string;
  color: string;
  icon: string;
}

export interface Transaction {
  id: UUID;
  accountId: UUID;
  categoryId: UUID | null;
  type: EntryType;
  amount: number;
  description: string | null;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
  account: MiniRef;
  category: MiniRef | null;
}

export interface PaginatedTransactions {
  items: Transaction[];
  total: number;
  limit: number;
  offset: number;
}

export interface SummaryReport {
  range: { from: string; to: string };
  totalBalance: number;
  activeAccounts: number;
  income: number;
  expense: number;
  net: number;
  transactionCount: number;
}

export interface CategoryShare {
  categoryId: UUID | null;
  name: string;
  color: string;
  icon: string;
  total: number;
  count: number;
  percentage: number;
}

export interface ByCategoryReport {
  range: { from: string; to: string };
  type: EntryType;
  grandTotal: number;
  items: CategoryShare[];
}

export interface TimelinePoint {
  date: string;
  income: number;
  expense: number;
  net: number;
}

export interface TimelineReport {
  range: { from: string; to: string };
  granularity: 'day' | 'month';
  items: TimelinePoint[];
}

export interface ApiError {
  error: { message: string; code: string; details?: { path: string; message: string }[] };
}
