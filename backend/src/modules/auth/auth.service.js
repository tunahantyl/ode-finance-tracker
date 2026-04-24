import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool, withTransaction } from '../../db/pool.js';
import { env } from '../../config/env.js';
import { AppError, Conflict, Unauthorized } from '../../utils/AppError.js';
import { seedDefaultCategories } from '../../db/seed.js';

function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    createdAt: row.created_at,
  };
}

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, env.auth.jwtSecret, {
    expiresIn: env.auth.jwtExpiresIn,
  });
}

export async function register({ email, password, fullName }) {
  const exists = await pool.query('SELECT 1 FROM users WHERE LOWER(email)=LOWER($1)', [email]);
  if (exists.rowCount) throw Conflict('Bu e-posta zaten kayıtlı.');

  const password_hash = await bcrypt.hash(password, env.auth.bcryptRounds);

  const user = await withTransaction(async (client) => {
    const r = await client.query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3) RETURNING *`,
      [email, password_hash, fullName]
    );
    const u = r.rows[0];
    // Seed default categories so the dashboard is useful immediately
    await seedDefaultCategories(client, u.id);
    // Seed a default cash account
    await client.query(
      `INSERT INTO accounts (user_id, name, type, current_balance, initial_balance, color, icon)
       VALUES ($1, 'Nakit', 'cash', 0, 0, '#0F172A', 'wallet')`,
      [u.id]
    );
    return u;
  });

  return { user: publicUser(user), token: signToken(user) };
}

export async function login({ email, password }) {
  const r = await pool.query('SELECT * FROM users WHERE LOWER(email)=LOWER($1)', [email]);
  const user = r.rows[0];
  if (!user) throw Unauthorized('E-posta veya şifre hatalı.');

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw Unauthorized('E-posta veya şifre hatalı.');

  return { user: publicUser(user), token: signToken(user) };
}

export async function me(userId) {
  const r = await pool.query('SELECT * FROM users WHERE id=$1', [userId]);
  if (!r.rowCount) throw new AppError('Kullanıcı bulunamadı.', 404, 'NOT_FOUND');
  return publicUser(r.rows[0]);
}
