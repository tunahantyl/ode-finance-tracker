import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

const sslConfig = env.db.ssl ? { rejectUnauthorized: false } : false;

export const pool = env.db.connectionString
  ? new Pool({
      connectionString: env.db.connectionString,
      ssl: sslConfig,
      max: 10,
      idleTimeoutMillis: 30_000,
    })
  : new Pool({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.database,
      ssl: sslConfig,
      max: 10,
      idleTimeoutMillis: 30_000,
    });

pool.on('error', (err) => {
  console.error('[pg pool] unexpected error', err);
});

export const query = (text, params) => pool.query(text, params);

export async function withTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
