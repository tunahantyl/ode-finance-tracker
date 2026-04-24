import { z } from 'zod';

export const createTransactionSchema = z.object({
  accountId: z.string().uuid(),
  categoryId: z.string().uuid().nullable().optional(),
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive('Tutar 0\'dan büyük olmalı.'),
  description: z.string().max(200).optional().nullable(),
  transactionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarih YYYY-MM-DD formatında olmalı.'),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const idParamSchema = z.object({ id: z.string().uuid() });

export const listQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  type: z.enum(['income', 'expense']).optional(),
  search: z.string().max(100).optional(),
  limit: z.coerce.number().int().positive().max(200).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});
