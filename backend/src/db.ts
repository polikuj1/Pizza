import { Pool } from 'pg';
import 'dotenv/config';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ponytail: Supabase's pooler cert isn't in Node's trust store; skip chain verification, add a pinned CA if that's ever required
  ssl: process.env.DATABASE_URL?.includes('supabase.com') ? { rejectUnauthorized: false } : undefined,
});
