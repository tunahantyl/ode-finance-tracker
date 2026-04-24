import { pool } from './pool.js';

export const DEFAULT_CATEGORIES = [
  // expenses
  { name: 'Market',         type: 'expense', color: '#10B981', icon: 'shopping-cart' },
  { name: 'Yeme & İçme',    type: 'expense', color: '#F59E0B', icon: 'utensils' },
  { name: 'Ulaşım',         type: 'expense', color: '#3B82F6', icon: 'car' },
  { name: 'Faturalar',      type: 'expense', color: '#EF4444', icon: 'receipt' },
  { name: 'Kira',           type: 'expense', color: '#8B5CF6', icon: 'home' },
  { name: 'Sağlık',         type: 'expense', color: '#EC4899', icon: 'heart' },
  { name: 'Eğlence',        type: 'expense', color: '#14B8A6', icon: 'film' },
  { name: 'Eğitim',         type: 'expense', color: '#6366F1', icon: 'book' },
  { name: 'Alışveriş',      type: 'expense', color: '#F97316', icon: 'shopping-bag' },
  { name: 'Diğer Gider',    type: 'expense', color: '#64748B', icon: 'tag' },
  // incomes
  { name: 'Maaş',           type: 'income',  color: '#22C55E', icon: 'briefcase' },
  { name: 'Ek Gelir',       type: 'income',  color: '#06B6D4', icon: 'plus-circle' },
  { name: 'Yatırım Geliri', type: 'income',  color: '#84CC16', icon: 'trending-up' },
  { name: 'Hediye',         type: 'income',  color: '#A855F7', icon: 'gift' },
  { name: 'Diğer Gelir',    type: 'income',  color: '#0EA5E9', icon: 'tag' },
];

export async function seedDefaultCategories(client, userId) {
  for (const c of DEFAULT_CATEGORIES) {
    await client.query(
      `INSERT INTO categories (user_id, name, type, color, icon)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, name, type) DO NOTHING`,
      [userId, c.name, c.type, c.color, c.icon]
    );
  }
}

// Allow direct CLI run for ad-hoc seeding (creates a demo user if missing)
async function main() {
  const email = 'demo@ode.app';
  const r = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (!r.rowCount) {
    console.log('No demo user found — register one via the API first.');
    await pool.end();
    return;
  }
  const userId = r.rows[0].id;
  const client = await pool.connect();
  try {
    await seedDefaultCategories(client, userId);
    console.log(`Seeded default categories for ${email}`);
  } finally {
    client.release();
    await pool.end();
  }
}

const entry = process.argv[1] ? `file://${process.argv[1].replace(/\\/g, '/')}` : null;
if (entry && import.meta.url === entry) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
