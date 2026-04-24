import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type {
  Account,
  ByCategoryReport,
  Category,
  EntryType,
  PaginatedTransactions,
  SummaryReport,
  TimelineReport,
  Transaction,
} from '@/types';

// ----- Accounts ----------------------------------------------------------
export const useAccounts = () =>
  useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await api.get<{ accounts: Account[] }>('/accounts')).data.accounts,
  });

export const useCreateAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Account>) =>
      (await api.post<{ account: Account }>('/accounts', payload)).data.account,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['report'] });
    },
  });
};

export const useUpdateAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Account> & { id: string }) =>
      (await api.patch<{ account: Account }>(`/accounts/${id}`, payload)).data.account,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['report'] });
    },
  });
};

export const useDeleteAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/accounts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['report'] });
    },
  });
};

export const useRecalculateAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await api.post<{ account: Account }>(`/accounts/${id}/recalculate`)).data.account,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['report'] });
    },
  });
};

// ----- Categories --------------------------------------------------------
export const useCategories = (type?: EntryType) =>
  useQuery({
    queryKey: ['categories', type ?? 'all'],
    queryFn: async () =>
      (
        await api.get<{ categories: Category[] }>('/categories', {
          params: type ? { type } : undefined,
        })
      ).data.categories,
  });

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Category>) =>
      (await api.post<{ category: Category }>('/categories', payload)).data.category,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Category> & { id: string }) =>
      (await api.patch<{ category: Category }>(`/categories/${id}`, payload)).data.category,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
};

// ----- Transactions ------------------------------------------------------
export interface TxFilters {
  from?: string;
  to?: string;
  type?: EntryType;
  accountId?: string;
  categoryId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export const useTransactions = (filters: TxFilters) =>
  useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () =>
      (await api.get<PaginatedTransactions>('/transactions', { params: filters })).data,
  });

export const useCreateTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: {
        accountId: string;
        categoryId: string | null;
        type: EntryType;
        amount: number;
        description?: string | null;
        transactionDate: string;
      }
    ) => (await api.post<{ transaction: Transaction }>('/transactions', payload)).data.transaction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['report'] });
    },
  });
};

export const useUpdateTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Partial<Transaction>) =>
      (await api.patch<{ transaction: Transaction }>(`/transactions/${id}`, payload)).data
        .transaction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['report'] });
    },
  });
};

export const useDeleteTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/transactions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['report'] });
    },
  });
};

// ----- Reports -----------------------------------------------------------
export const useSummary = (range?: { from?: string; to?: string }) =>
  useQuery({
    queryKey: ['report', 'summary', range],
    queryFn: async () =>
      (await api.get<SummaryReport>('/reports/summary', { params: range })).data,
  });

export const useByCategory = (params: { from?: string; to?: string; type?: EntryType }) =>
  useQuery({
    queryKey: ['report', 'byCategory', params],
    queryFn: async () =>
      (await api.get<ByCategoryReport>('/reports/by-category', { params })).data,
  });

export const useTimeline = (params: {
  from?: string;
  to?: string;
  granularity?: 'day' | 'month';
}) =>
  useQuery({
    queryKey: ['report', 'timeline', params],
    queryFn: async () => (await api.get<TimelineReport>('/reports/timeline', { params })).data,
  });

export const useRecentTransactions = (limit = 8) =>
  useQuery({
    queryKey: ['report', 'recent', limit],
    queryFn: async () =>
      (
        await api.get<{ items: Transaction[] }>('/reports/recent-transactions', {
          params: { limit },
        })
      ).data.items,
  });
