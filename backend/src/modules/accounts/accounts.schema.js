import { z } from 'zod';

const accountTypes = ['cash', 'bank', 'card', 'savings', 'other'];

export const createAccountSchema = z.object({
  name: z.string().min(1).max(80),
  type: z.enum(accountTypes),
  initialBalance: z.coerce.number().finite().default(0),
  currency: z.string().length(3).default('TRY'),
  color: z.string().regex(/^#([0-9A-Fa-f]{3,8})$/).default('#0F172A'),
  icon: z.string().max(40).default('wallet'),
});

export const updateAccountSchema = createAccountSchema.partial().extend({
  isArchived: z.boolean().optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});
