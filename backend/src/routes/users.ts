import { Router } from 'express';
import { pool } from '../db';
import { ah } from '../asyncHandler';
import { hashPassword, requirePermission } from '../auth';
import { PERMISSIONS } from '../config';

export const usersRouter = Router();

function sanitizePermissions(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.filter((p): p is string => (PERMISSIONS as readonly string[]).includes(p));
}

function rowToUser(row: any) {
  return { id: row.id, username: row.username, permissions: row.permissions, createdAt: row.created_at };
}

usersRouter.use(requirePermission('users'));

usersRouter.get(
  '/',
  ah(async (_req, res) => {
    const result = await pool.query('SELECT id, username, permissions, created_at FROM users ORDER BY id ASC');
    res.json(result.rows.map(rowToUser));
  })
);

usersRouter.post(
  '/',
  ah(async (req, res) => {
    const { username, password, permissions } = req.body ?? {};
    if (!username?.trim() || !password) return res.status(400).json({ error: '請填寫帳號與密碼' });
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, permissions) VALUES ($1, $2, $3) RETURNING id, username, permissions, created_at',
      [username.trim(), hashPassword(password), sanitizePermissions(permissions)]
    );
    res.status(201).json(rowToUser(result.rows[0]));
  })
);

usersRouter.patch(
  '/:id',
  ah(async (req, res) => {
    const { password, permissions } = req.body ?? {};
    const result = await pool.query(
      `UPDATE users SET
         password_hash = COALESCE($2, password_hash),
         permissions = COALESCE($3, permissions)
       WHERE id = $1 RETURNING id, username, permissions, created_at`,
      [req.params.id, password ? hashPassword(password) : null, permissions ? sanitizePermissions(permissions) : null]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: '帳號不存在' });
    res.json(rowToUser(result.rows[0]));
  })
);

usersRouter.delete(
  '/:id',
  ah(async (req, res) => {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  })
);
