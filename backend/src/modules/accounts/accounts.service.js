import { pool } from '../../db/pool.js';
import { NotFound } from '../../utils/AppError.js';

const SELECT = `
  SELECT id, user_id, name, type, current_balance, initial_balance,
         currency, color, icon, is_archived, created_at, updated_at
  FROM accounts
`;

function map(r) {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    currentBalance: Number(r.current_balance),
    initialBalance: Number(r.initial_balance),
    currency: r.currency,
    color: r.color,
    icon: r.icon,
    isArchived: r.is_archived,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function list(userId) {
  const r = await pool.query(
    `${SELECT} WHERE user_id=$1 ORDER BY is_archived ASC, created_at ASC`,
    [userId]
  );
  return r.rows.map(map);
}

export async function getById(userId, id) {
  const r = await pool.query(`${SELECT} WHERE user_id=$1 AND id=$2`, [userId, id]);
  if (!r.rowCount) throw NotFound('Hesap bulunamadı.');
  return map(r.rows[0]);
}

export async function create(userId, data) {
  const r = await pool.query(
    `INSERT INTO accounts
       (user_id, name, type, current_balance, initial_balance, currency, color, icon)
     VALUES ($1, $2, $3, $4, $4, $5, $6, $7)
     RETURNING *`,
    [
      userId,
      data.name,
      data.type,
      data.initialBalance,
      data.currency,
      data.color,
      data.icon,
    ]
  );
  return map(r.rows[0]);
}

export async function update(userId, id, data) {
  const fields = [];
  const values = [];
  let i = 1;

  const map2db = {
    name: 'name',
    type: 'type',
    currency: 'currency',
    color: 'color',
    icon: 'icon',
    isArchived: 'is_archived',
  };

  for (const [k, col] of Object.entries(map2db)) {
    if (data[k] !== undefined) {
      fields.push(`${col} = $${i++}`);
      values.push(data[k]);
    }
  }

  if (!fields.length) return getById(userId, id);

  values.push(userId, id);
  const r = await pool.query(
    `UPDATE accounts SET ${fields.join(', ')}
     WHERE user_id = $${i++} AND id = $${i}
     RETURNING *`,
    values
  );
  if (!r.rowCount) throw NotFound('Hesap bulunamadı.');
  return map(r.rows[0]);
}

export async function remove(userId, id) {
  const r = await pool.query(
    'DELETE FROM accounts WHERE user_id=$1 AND id=$2 RETURNING id',
    [userId, id]
  );
  if (!r.rowCount) throw NotFound('Hesap bulunamadı.');
}

/**
 * Recalculate the stored current_balance from transactions.
 * Useful as a self-healing endpoint and gives users confidence in correctness.
 */
export async function recalculate(userId, id) {
  const r = await pool.query(
    `WITH agg AS (
       SELECT
         COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END), 0) AS delta
       FROM transactions WHERE user_id=$1 AND account_id=$2
     )
     UPDATE accounts a
        SET current_balance = a.initial_balance + agg.delta
       FROM agg
      WHERE a.user_id=$1 AND a.id=$2
     RETURNING a.*`,
    [userId, id]
  );
  if (!r.rowCount) throw NotFound('Hesap bulunamadı.');
  return map(r.rows[0]);
}
