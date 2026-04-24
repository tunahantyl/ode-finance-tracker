import { z } from 'zod';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD bekleniyor.');

export const rangeSchema = z.object({
  from: date.optional(),
  to: date.optional(),
});

export const byCategorySchema = rangeSchema.extend({
  type: z.enum(['income', 'expense']).default('expense'),
});

export const timelineSchema = rangeSchema.extend({
  granularity: z.enum(['day', 'month']).default('day'),
});
