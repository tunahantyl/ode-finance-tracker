import { test } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { registerSchema, loginSchema } from '../src/modules/auth/auth.schema.js';
import { createTransactionSchema } from '../src/modules/transactions/transactions.schema.js';
import { createAccountSchema } from '../src/modules/accounts/accounts.schema.js';
import { createCategorySchema } from '../src/modules/categories/categories.schema.js';

test('register schema validates good input', () => {
  const r = registerSchema.safeParse({
    email: 'demo@ode.app',
    password: 'secret123',
    fullName: 'Demo User',
  });
  assert.equal(r.success, true);
});

test('register schema rejects short password', () => {
  const r = registerSchema.safeParse({
    email: 'demo@ode.app',
    password: '123',
    fullName: 'Demo',
  });
  assert.equal(r.success, false);
});

test('login schema rejects empty password', () => {
  const r = loginSchema.safeParse({ email: 'a@b.co', password: '' });
  assert.equal(r.success, false);
});

test('account schema applies defaults', () => {
  const r = createAccountSchema.parse({ name: 'Cüzdan', type: 'cash' });
  assert.equal(r.currency, 'TRY');
  assert.equal(r.color, '#0F172A');
  assert.equal(r.initialBalance, 0);
});

test('category schema enforces type enum', () => {
  const r = createCategorySchema.safeParse({ name: 'X', type: 'foo' });
  assert.equal(r.success, false);
});

test('transaction schema requires positive amount', () => {
  const bad = createTransactionSchema.safeParse({
    accountId: '00000000-0000-0000-0000-000000000000',
    type: 'expense',
    amount: 0,
    transactionDate: '2026-01-01',
  });
  assert.equal(bad.success, false);

  const good = createTransactionSchema.safeParse({
    accountId: '00000000-0000-0000-0000-000000000000',
    type: 'expense',
    amount: 12.5,
    transactionDate: '2026-01-01',
  });
  assert.equal(good.success, true);
});

test('transaction schema rejects bad date', () => {
  const r = createTransactionSchema.safeParse({
    accountId: '00000000-0000-0000-0000-000000000000',
    type: 'income',
    amount: 1,
    transactionDate: '2026/01/01',
  });
  assert.equal(r.success, false);
});

test('bcrypt hash + compare round-trip', async () => {
  const hash = await bcrypt.hash('hello', 4);
  assert.equal(await bcrypt.compare('hello', hash), true);
  assert.equal(await bcrypt.compare('nope', hash), false);
});

test('jwt sign + verify round-trip', () => {
  const token = jwt.sign({ sub: 'abc' }, 'secret');
  const decoded = jwt.verify(token, 'secret');
  assert.equal(decoded.sub, 'abc');
});
