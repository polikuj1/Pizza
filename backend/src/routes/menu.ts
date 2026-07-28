import { Router } from 'express';
import { pool } from '../db';
import { CATEGORIES } from '../config';
import { ah } from '../asyncHandler';
import type { MenuItem } from '../types';

export const menuRouter = Router();

menuRouter.get(
  '/',
  ah(async (_req, res) => {
    const result = await pool.query(
      'SELECT id, zh, en, description, price, category, has_temp AS "hasTemp" FROM menu_items ORDER BY category, price'
    );
    res.json({ items: result.rows as MenuItem[], categories: CATEGORIES });
  })
);
