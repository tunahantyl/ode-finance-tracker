import { pool } from '../../db/pool.js';
import { NotFound } from '../../utils/AppError.js';

const SELECT = `
  SELECT id, user_id, name, type, color, icon, parent_id,
         is_archived, created_at, updated_at
  FROM categories
`;

function map(r) {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    color: r.color,
    icon: r.icon,
    parentId: r.parent_id,
    isArchived: r.is_archived,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function list(userId, { type, includeArchived } = {}) {
  const params = [userId];
  let where = 'WHERE user_id=$1';
  if (type) {
    params.push(type);
    where += ` AND type=$${params.length}`;
  }
  if (!includeArchived) {
    where += ' AND is_archived = FALSE';
  }
  const r = await pool.query(`${SELECT} ${where} ORDER BY type, name`, params);
  return r.rows.map(map);
}

export async function create(userId, data) {
  const r = await pool.query(
    `INSERT INTO categories (user_id, name, type, color, icon, parent_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, data.name, data.type, data.color, data.icon, data.parentId ?? null]
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
    color: 'color',
    icon: 'icon',
    parentId: 'parent_id',
    isArchived: 'is_archived',
  };
  for (const [k, col] of Object.entries(map2db)) {
    if (data[k] !== undefined) {
      fields.push(`${col} = $${i++}`);
      values.push(data[k]);
    }
  }
  if (!fields.length) {
    const r = await pool.query(`${SELECT} WHERE user_id=$1 AND id=$2`, [userId, id]);
    if (!r.rowCount) throw NotFound('Kategori bulunamadı.');
    return map(r.rows[0]);
  }
  values.push(userId, id);
  const r = await pool.query(
    `UPDATE categories SET ${fields.join(', ')}
     WHERE user_id=$${i++} AND id=$${i}
     RETURNING *`,
    values
  );
  if (!r.rowCount) throw NotFound('Kategori bulunamadı.');
  return map(r.rows[0]);
}

export async function remove(userId, id) {
  const r = await pool.query(
    'DELETE FROM categories WHERE user_id=$1 AND id=$2 RETURNING id',
    [userId, id]
  );
  if (!r.rowCount) throw NotFound('Kategori bulunamadı.');
}
