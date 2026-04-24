import { pool, withTransaction } from '../../db/pool.js';
import { BadRequest, NotFound } from '../../utils/AppError.js';

const SELECT_JOIN = `
  SELECT t.id, t.user_id, t.account_id, t.category_id, t.type, t.amount,
         t.description, t.transaction_date, t.created_at, t.updated_at,
         a.name AS account_name, a.color AS account_color, a.icon AS account_icon,
         c.name AS category_name, c.color AS category_color, c.icon AS category_icon
  FROM transactions t
  JOIN accounts a ON a.id = t.account_id
  LEFT JOIN categories c ON c.id = t.category_id
`;

function map(r) {
  return {
    id: r.id,
    accountId: r.account_id,
    categoryId: r.category_id,
    type: r.type,
    amount: Number(r.amount),
    description: r.description,
    transactionDate: r.transaction_date,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    account: { id: r.account_id, name: r.account_name, color: r.account_color, icon: r.account_icon },
    category: r.category_id
      ? { id: r.category_id, name: r.category_name, color: r.category_color, icon: r.category_icon }
      : null,
  };
}

/**
 * Sign helper: incomes add, expenses subtract.
 */
const sign = (type) => (type === 'income' ? 1 : -1);

/**
 * Verify that an account belongs to the user (and lock it for the transaction).
 */
async function lockAccount(client, userId, accountId) {
  const r = await client.query(
    'SELECT id FROM accounts WHERE user_id=$1 AND id=$2 FOR UPDATE',
    [userId, accountId]
  );
  if (!r.rowCount) throw NotFound('Hesap bulunamadı.');
}

async function verifyCategory(client, userId, categoryId, type) {
  if (!categoryId) return;
  const r = await client.query(
    'SELECT type FROM categories WHERE user_id=$1 AND id=$2',
    [userId, categoryId]
  );
  if (!r.rowCount) throw NotFound('Kategori bulunamadı.');
  if (r.rows[0].type !== type) {
    throw BadRequest('Kategori türü işlem türü ile uyuşmuyor.');
  }
}

export async function list(userId, q) {
  const params = [userId];
  let where = 'WHERE t.user_id = $1';

  if (q.from) {
    params.push(q.from);
    where += ` AND t.transaction_date >= $${params.length}`;
  }
  if (q.to) {
    params.push(q.to);
    where += ` AND t.transaction_date <= $${params.length}`;
  }
  if (q.accountId) {
    params.push(q.accountId);
    where += ` AND t.account_id = $${params.length}`;
  }
  if (q.categoryId) {
    params.push(q.categoryId);
    where += ` AND t.category_id = $${params.length}`;
  }
  if (q.type) {
    params.push(q.type);
    where += ` AND t.type = $${params.length}`;
  }
  if (q.search) {
    params.push(`%${q.search}%`);
    where += ` AND t.description ILIKE $${params.length}`;
  }

  // total count for pagination
  const countQ = await pool.query(
    `SELECT COUNT(*)::int AS total FROM transactions t ${where}`,
    params
  );

  params.push(q.limit, q.offset);
  const r = await pool.query(
    `${SELECT_JOIN} ${where}
     ORDER BY t.transaction_date DESC, t.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    items: r.rows.map(map),
    total: countQ.rows[0].total,
    limit: q.limit,
    offset: q.offset,
  };
}

export async function getById(userId, id) {
  const r = await pool.query(`${SELECT_JOIN} WHERE t.user_id=$1 AND t.id=$2`, [userId, id]);
  if (!r.rowCount) throw NotFound('İşlem bulunamadı.');
  return map(r.rows[0]);
}

/**
 * Atomically: insert transaction + adjust account balance.
 */
export async function create(userId, data) {
  return withTransaction(async (client) => {
    await lockAccount(client, userId, data.accountId);
    await verifyCategory(client, userId, data.categoryId, data.type);

    const ins = await client.query(
      `INSERT INTO transactions
         (user_id, account_id, category_id, type, amount, description, transaction_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [
        userId,
        data.accountId,
        data.categoryId ?? null,
        data.type,
        data.amount,
        data.description ?? null,
        data.transactionDate,
      ]
    );

    const delta = sign(data.type) * Number(data.amount);
    await client.query(
      'UPDATE accounts SET current_balance = current_balance + $1 WHERE id = $2',
      [delta, data.accountId]
    );

    const r = await client.query(`${SELECT_JOIN} WHERE t.id=$1`, [ins.rows[0].id]);
    return map(r.rows[0]);
  });
}

/**
 * Update reverses the prior effect on the original account, then applies the new one.
 */
export async function update(userId, id, data) {
  return withTransaction(async (client) => {
    const cur = await client.query(
      'SELECT * FROM transactions WHERE user_id=$1 AND id=$2 FOR UPDATE',
      [userId, id]
    );
    if (!cur.rowCount) throw NotFound('İşlem bulunamadı.');
    const prev = cur.rows[0];

    const next = {
      account_id: data.accountId ?? prev.account_id,
      category_id: data.categoryId === undefined ? prev.category_id : data.categoryId,
      type: data.type ?? prev.type,
      amount: data.amount ?? Number(prev.amount),
      description: data.description === undefined ? prev.description : data.description,
      transaction_date: data.transactionDate ?? prev.transaction_date,
    };

    await lockAccount(client, userId, prev.account_id);
    if (next.account_id !== prev.account_id) {
      await lockAccount(client, userId, next.account_id);
    }
    if (next.category_id) {
      await verifyCategory(client, userId, next.category_id, next.type);
    }

    // Reverse old effect
    await client.query(
      'UPDATE accounts SET current_balance = current_balance + $1 WHERE id = $2',
      [-sign(prev.type) * Number(prev.amount), prev.account_id]
    );
    // Apply new effect
    await client.query(
      'UPDATE accounts SET current_balance = current_balance + $1 WHERE id = $2',
      [sign(next.type) * Number(next.amount), next.account_id]
    );

    await client.query(
      `UPDATE transactions SET
         account_id=$1, category_id=$2, type=$3, amount=$4,
         description=$5, transaction_date=$6
       WHERE id=$7`,
      [
        next.account_id,
        next.category_id,
        next.type,
        next.amount,
        next.description,
        next.transaction_date,
        id,
      ]
    );

    const r = await client.query(`${SELECT_JOIN} WHERE t.id=$1`, [id]);
    return map(r.rows[0]);
  });
}

export async function remove(userId, id) {
  return withTransaction(async (client) => {
    const cur = await client.query(
      'SELECT * FROM transactions WHERE user_id=$1 AND id=$2 FOR UPDATE',
      [userId, id]
    );
    if (!cur.rowCount) throw NotFound('İşlem bulunamadı.');
    const prev = cur.rows[0];

    await lockAccount(client, userId, prev.account_id);

    await client.query('DELETE FROM transactions WHERE id=$1', [id]);
    await client.query(
      'UPDATE accounts SET current_balance = current_balance + $1 WHERE id = $2',
      [-sign(prev.type) * Number(prev.amount), prev.account_id]
    );
  });
}
