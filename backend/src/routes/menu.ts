import { Router } from 'express';
import { pool } from '../db';
import { CATEGORIES } from '../config';
import { ah } from '../asyncHandler';
import { requirePermission } from '../auth';
import type { MenuItem } from '../types';

export const menuRouter = Router();

const SELECT_COLUMNS = 'id, zh, en, description, price, category, has_temp AS "hasTemp", sold_out AS "soldOut", enabled';
const VALID_ID = /^[a-z0-9_-]+$/i;

function parseMenuItemInput(body: any): { error?: string; value?: MenuItem } {
  const id = String(body.id ?? '').trim();
  const zh = String(body.zh ?? '').trim();
  const en = String(body.en ?? '').trim();
  const description = String(body.description ?? '');
  const price = Number(body.price);
  const category = String(body.category ?? '');
  const hasTemp = !!body.hasTemp;
  const soldOut = !!body.soldOut;
  const enabled = body.enabled !== false;

  if (!VALID_ID.test(id)) return { error: 'id 只能是英數字、- 或 _' };
  if (!zh || !en) return { error: '請填寫中英文名稱' };
  if (!Number.isFinite(price) || price < 0) return { error: '價格不正確' };
  if (!CATEGORIES.some((c) => c.id === category)) return { error: '分類不正確' };

  return { value: { id, zh, en, description, price, category, hasTemp, soldOut, enabled } };
}

menuRouter.get(
  '/',
  ah(async (_req, res) => {
    const result = await pool.query(`SELECT ${SELECT_COLUMNS} FROM menu_items ORDER BY category, price`);
    res.json({ items: result.rows as MenuItem[], categories: CATEGORIES });
  })
);

menuRouter.post(
  '/',
  requirePermission('menu'),
  ah(async (req, res) => {
    const parsed = parseMenuItemInput(req.body ?? {});
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const { id, zh, en, description, price, category, hasTemp, soldOut, enabled } = parsed.value!;

    const exists = await pool.query('SELECT 1 FROM menu_items WHERE id = $1', [id]);
    if ((exists.rowCount ?? 0) > 0) return res.status(400).json({ error: '此 id 已存在' });

    const result = await pool.query(
      `INSERT INTO menu_items (id, zh, en, description, price, category, has_temp, sold_out, enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING ${SELECT_COLUMNS}`,
      [id, zh, en, description, price, category, hasTemp, soldOut, enabled]
    );
    res.status(201).json(result.rows[0]);
  })
);

menuRouter.patch(
  '/:id',
  requirePermission('menu'),
  ah(async (req, res) => {
    const parsed = parseMenuItemInput({ ...req.body, id: req.params.id });
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const { zh, en, description, price, category, hasTemp, soldOut, enabled } = parsed.value!;

    const result = await pool.query(
      `UPDATE menu_items SET zh = $2, en = $3, description = $4, price = $5, category = $6, has_temp = $7, sold_out = $8, enabled = $9
       WHERE id = $1 RETURNING ${SELECT_COLUMNS}`,
      [req.params.id, zh, en, description, price, category, hasTemp, soldOut, enabled]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: '品項不存在' });
    res.json(result.rows[0]);
  })
);
