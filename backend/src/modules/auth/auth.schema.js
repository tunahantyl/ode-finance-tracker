import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Geçerli bir e-posta giriniz.').max(255),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı.').max(72),
  fullName: z.string().min(2, 'Ad en az 2 karakter olmalı.').max(120),
});

export const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta giriniz.'),
  password: z.string().min(1, 'Şifre gerekli.'),
});
