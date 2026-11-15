import fs from 'node:fs';
import path from 'node:path';
import { pool } from '../config/db';

// Миграция — файл SQL, который выполняется один раз. Это история изменений базы.
export async function migrate(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
    const dir = path.resolve(__dirname, '../../migrations');
    for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort()) {
      const exists = await client.query('SELECT 1 FROM schema_migrations WHERE name=$1', [file]);
      if (exists.rowCount) continue;
      await client.query('BEGIN');
      try {
        await client.query(fs.readFileSync(path.join(dir, file), 'utf8'));
        await client.query('INSERT INTO schema_migrations(name) VALUES($1)', [file]);
        await client.query('COMMIT');
        console.log(`Миграция выполнена: ${file}`);
      } catch (error) { await client.query('ROLLBACK'); throw error; }
    }
  } finally { client.release(); }
}
if (require.main === module) migrate().then(() => pool.end()).catch(error => { console.error(error); process.exit(1); });
