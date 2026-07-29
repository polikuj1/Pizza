import { pool } from './db';

export async function getStoreOpen(): Promise<boolean> {
  const result = await pool.query('SELECT store_open FROM settings WHERE id = 1');
  return result.rows[0]?.store_open ?? true;
}

export async function setStoreOpen(open: boolean): Promise<void> {
  await pool.query('UPDATE settings SET store_open = $1 WHERE id = 1', [open]);
}
