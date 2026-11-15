import { Pool } from 'pg';
import { env } from './env';
// pg использует параметризованные SQL-запросы ($1, $2): так защищаемся от SQL-инъекций.
export const pool = new Pool({ connectionString: env.databaseUrl, max: 12 });
