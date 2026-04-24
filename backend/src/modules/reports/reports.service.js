import { pool } from '../../db/pool.js';

function defaultRange(q) {
  const today = new Date();
  const to = q.to || today.toISOString().slice(0, 10);
  const fromDate = new Date(today);
  fromDate.setDate(fromDate.getDate() - 29);
  const from = q.from || fromDate.toISOString().slice(0, 10);
  return { from, to };
}

export async function summary(userId, q) {
  const { from, to } = defaultRange(q);

  const totalsQ = pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0)::numeric AS income,
       COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0)::numeric AS expense,
       COUNT(*)::int AS count
     FROM transactions
     WHERE user_id = $1
       AND transaction_date BETWEEN $2 AND $3`,
    [userId, from, to]
  );

  const balanceQ = pool.query(
    `SELECT
       COALESCE(SUM(current_balance), 0)::numeric AS total_balance,
       COUNT(*) FILTER (WHERE NOT is_archived)::int AS active_count
     FROM accounts WHERE user_id=$1`,
    [userId]
  );

  const [t, b] = await Promise.all([totalsQ, balanceQ]);

  const income = Number(t.rows[0].income);
  const expense = Number(t.rows[0].expense);

  return {
    range: { from, to },
    totalBalance: Number(b.rows[0].total_balance),
    activeAccounts: b.rows[0].active_count,
    income,
    expense,
    net: income - expense,
    transactionCount: t.rows[0].count,
  };
}

export async function byCategory(userId, q) {
  const { from, to } = defaultRange(q);
  const r = await pool.query(
    `SELECT c.id, c.name, c.color, c.icon,
            COALESCE(SUM(t.amount), 0)::numeric AS total,
            COUNT(t.id)::int AS count
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.user_id = $1
       AND t.type = $2
       AND t.transaction_date BETWEEN $3 AND $4
     GROUP BY c.id, c.name, c.color, c.icon
     ORDER BY total DESC`,
    [userId, q.type, from, to]
  );
  const items = r.rows.map((row) => ({
    categoryId: row.id,
    name: row.name || 'Kategorisiz',
    color: row.color || '#94A3B8',
    icon: row.icon || 'tag',
    total: Number(row.total),
    count: row.count,
  }));
  const grandTotal = items.reduce((s, it) => s + it.total, 0);
  return {
    range: { from, to },
    type: q.type,
    grandTotal,
    items: items.map((it) => ({
      ...it,
      percentage: grandTotal > 0 ? +(it.total / grandTotal * 100).toFixed(2) : 0,
    })),
  };
}

export async function timeline(userId, q) {
  const { from, to } = defaultRange(q);
  const trunc = q.granularity === 'month' ? 'month' : 'day';

  const r = await pool.query(
    `SELECT
       date_trunc($4, transaction_date)::date AS bucket,
       COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0)::numeric AS income,
       COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0)::numeric AS expense
     FROM transactions
     WHERE user_id = $1 AND transaction_date BETWEEN $2 AND $3
     GROUP BY bucket
     ORDER BY bucket`,
    [userId, from, to, trunc]
  );

  return {
    range: { from, to },
    granularity: q.granularity,
    items: r.rows.map((row) => ({
      date: row.bucket,
      income: Number(row.income),
      expense: Number(row.expense),
      net: Number(row.income) - Number(row.expense),
    })),
  };
}

export async function recent(userId, limit = 10) {
  const r = await pool.query(
    `SELECT t.id, t.type, t.amount, t.description, t.transaction_date,
            a.id AS account_id, a.name AS account_name, a.color AS account_color, a.icon AS account_icon,
            c.id AS category_id, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
     FROM transactions t
     JOIN accounts a ON a.id = t.account_id
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.user_id = $1
     ORDER BY t.transaction_date DESC, t.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  return r.rows.map((row) => ({
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    description: row.description,
    transactionDate: row.transaction_date,
    account: {
      id: row.account_id,
      name: row.account_name,
      color: row.account_color,
      icon: row.account_icon,
    },
    category: row.category_id
      ? {
          id: row.category_id,
          name: row.category_name,
          color: row.category_color,
          icon: row.category_icon,
        }
      : null,
  }));
}
