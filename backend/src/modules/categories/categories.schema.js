import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(60),
  type: z.enum(['income', 'expense']),
  color: z.string().regex(/^#([0-9A-Fa-f]{3,8})$/).default('#64748B'),
  icon: z.string().max(40).default('tag'),
  parentId: z.string().uuid().nullable().optional(),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  isArchived: z.boolean().optional(),
});

export const idParamSchema = z.object({ id: z.string().uuid() });

export const listQuerySchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  includeArchived: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((v) => v === true || v === 'true'),
});
