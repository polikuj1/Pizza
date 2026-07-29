import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { pool } from './db';
import type { Permission } from './config';

const rawSecret = process.env.SESSION_SECRET;
if (!rawSecret) {
  throw new Error('SESSION_SECRET 未設定，請在 .env 或部署環境變數中設定（勿使用預設值）');
}
const SECRET: string = rawSecret;
const TTL_MS = 12 * 60 * 60 * 1000;
export const SESSION_COOKIE = 'staff_session';

function hmac(value: string): string {
  return crypto.createHmac('sha256', SECRET).update(value).digest('hex');
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64).toString('hex');
  return timingSafeEqual(candidate, hash);
}

export function createSessionToken(userId: number): string {
  const expiresAt = Date.now() + TTL_MS;
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${hmac(payload)}`;
}

function verifySessionToken(token: string | undefined): number | null {
  if (!token) return null;
  const [userIdStr, expiresAtStr, sig] = token.split('.');
  const expiresAt = Number(expiresAtStr);
  const userId = Number(userIdStr);
  if (!userId || !expiresAt || Date.now() > expiresAt || !sig) return null;
  return timingSafeEqual(sig, hmac(`${userIdStr}.${expiresAtStr}`)) ? userId : null;
}

// ponytail: cookie-parser would need a new dependency for one header split
function getCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

export function getSessionUserId(req: Request): number | null {
  return verifySessionToken(getCookie(req, SESSION_COOKIE));
}

export function isAuthenticated(req: Request): boolean {
  return getSessionUserId(req) !== null;
}

export function requireStaffAuth(req: Request, res: Response, next: NextFunction) {
  if (isAuthenticated(req)) return next();
  res.status(401).json({ error: '請先登入' });
}

export function requirePermission(permission: Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = getSessionUserId(req);
    if (!userId) return res.status(401).json({ error: '請先登入' });
    try {
      const result = await pool.query('SELECT permissions FROM users WHERE id = $1', [userId]);
      const permissions: string[] = result.rows[0]?.permissions ?? [];
      if (!permissions.includes(permission)) return res.status(403).json({ error: '沒有權限' });
      next();
    } catch (err) {
      next(err);
    }
  };
}
