import 'dotenv/config';
import { Pool, QueryResultRow } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Add your Supabase Postgres connection string to the backend .env file.');
}

export const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('supabase') ? { rejectUnauthorized: false } : false,
});

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export async function testDatabaseConnection() {
  const rows = await query<{ now: string }>('SELECT NOW() AS now');
  return rows[0]?.now ?? null;
}
