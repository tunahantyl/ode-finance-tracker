import app from './app.js';
import { env } from './config/env.js';
import { pool } from './db/pool.js';

async function start() {
  try {
    const r = await pool.query('SELECT NOW()');
    console.log(`[db] connected (${r.rows[0].now})`);
  } catch (e) {
    console.error('[db] connection failed:', e.message);
    console.error('   Tip: PostgreSQL servisini başlattığınızdan emin olun.');
    console.error('   .env dosyasındaki PG* ve DATABASE_URL değerlerini kontrol edin.');
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    console.log(`[ode] listening on http://localhost:${env.port}  (env=${env.nodeEnv})`);
  });

  const shutdown = async (signal) => {
    console.log(`\n${signal} received — shutting down...`);
    server.close(() => console.log('[http] closed'));
    await pool.end();
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
