import { Router } from 'express';
import { pool } from '../db';
import { ah } from '../asyncHandler';
import { createSessionToken, getSessionUserId, SESSION_COOKIE, verifyPassword } from '../auth';

export const authRouter = Router();

// 前後端部署在不同網域（如 Render 後端 + 其他平台前端）時，cookie 需要 sameSite: 'none' 才會被跨站帶上
const isProd = process.env.NODE_ENV === 'production';
const SESSION_COOKIE_OPTIONS: { httpOnly: boolean; sameSite: 'none' | 'lax'; secure: boolean } = {
  httpOnly: true,
  sameSite: isProd ? 'none' : 'lax',
  secure: isProd,
};

authRouter.post(
  '/login',
  ah(async (req, res) => {
    const { username, password } = req.body ?? {};
    const result = await pool.query('SELECT id, password_hash, permissions FROM users WHERE username = $1', [
      String(username ?? ''),
    ]);
    const user = result.rows[0];
    if (!user || !verifyPassword(String(password ?? ''), user.password_hash)) {
      return res.status(401).json({ error: '帳號或密碼錯誤' });
    }
    res.cookie(SESSION_COOKIE, createSessionToken(user.id), { ...SESSION_COOKIE_OPTIONS, maxAge: 12 * 60 * 60 * 1000 });
    res.json({ ok: true, permissions: user.permissions });
  })
);

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(SESSION_COOKIE, SESSION_COOKIE_OPTIONS);
  res.json({ ok: true });
});

authRouter.get(
  '/me',
  ah(async (req, res) => {
    const userId = getSessionUserId(req);
    if (!userId) return res.json({ authenticated: false, permissions: [] });
    const result = await pool.query('SELECT permissions FROM users WHERE id = $1', [userId]);
    res.json({ authenticated: true, permissions: result.rows[0]?.permissions ?? [] });
  })
);
