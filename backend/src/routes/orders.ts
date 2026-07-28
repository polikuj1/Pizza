import { Router } from 'express';
import { pool } from '../db';
import { config, TABLES } from '../config';
import { ah } from '../asyncHandler';
import type { CartItemInput, MenuItem, Order, OrderLine } from '../types';

export const ordersRouter = Router();

function rowToOrder(row: any): Order {
  return {
    id: row.id,
    items: row.items,
    total: row.total,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    note: row.note,
    payment: row.payment,
    status: row.status,
    orderType: row.order_type,
    table: row.table_num,
    createdAt: row.created_at,
    servedAt: row.served_at,
    completedAt: row.completed_at,
  };
}

async function buildLines(cartItems: CartItemInput[]): Promise<OrderLine[]> {
  if (cartItems.length === 0) return [];
  const ids = cartItems.map((c) => c.id);
  const result = await pool.query(
    'SELECT id, zh, price, category, has_temp AS "hasTemp" FROM menu_items WHERE id = ANY($1)',
    [ids]
  );
  const menuById = new Map<string, MenuItem>(result.rows.map((r: any) => [r.id, r]));
  const lines: OrderLine[] = [];
  for (const cartItem of cartItems) {
    const item = menuById.get(cartItem.id);
    if (!item || cartItem.qty <= 0) continue;
    const cheese = item.category === 'pizza' && !!cartItem.cheese;
    const temp: 'ice' | 'hot' = cartItem.temp === 'hot' ? 'hot' : 'ice';
    const unitPrice = item.price + (cheese ? config.cheeseUpcharge : 0);
    lines.push({
      id: item.id,
      zh: item.zh,
      qty: cartItem.qty,
      cheese,
      temp,
      unitPrice,
      lineTotal: unitPrice * cartItem.qty,
      cheeseSuffix: cheese ? '（+起司）' : '',
      tempSuffix: item.hasTemp ? `（${temp === 'hot' ? '熱' : '冰'}）` : '',
    });
  }
  return lines;
}

// dine-in orders are cleared via /clear instead of advancing through the queue past "餐點已出"
const MAX_STATUS = 3;

ordersRouter.get(
  '/',
  ah(async (req, res) => {
    const scope = req.query.scope === 'history' ? 'history' : 'active';
    const result =
      scope === 'history'
        ? await pool.query('SELECT * FROM orders WHERE status = $1 ORDER BY completed_at DESC', [MAX_STATUS])
        : await pool.query('SELECT * FROM orders WHERE status < $1 ORDER BY id ASC', [MAX_STATUS]);
    res.json(result.rows.map(rowToOrder));
  })
);

ordersRouter.get(
  '/:id',
  ah(async (req, res) => {
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: '訂單不存在' });
    res.json(rowToOrder(result.rows[0]));
  })
);

ordersRouter.post(
  '/',
  ah(async (req, res) => {
    if (!config.storeOpen) return res.status(400).json({ error: '本日公休，暫停線上點餐' });
    const { items, customerName, customerPhone, note, payment } = req.body;
    const lines = await buildLines(items ?? []);
    if (lines.length === 0) return res.status(400).json({ error: '購物車是空的' });
    if (!customerName?.trim() || !customerPhone?.trim()) return res.status(400).json({ error: '請填寫姓名與電話' });

    const total = lines.reduce((n, l) => n + l.lineTotal, 0);
    const result = await pool.query(
      `INSERT INTO orders (items, total, customer_name, customer_phone, note, payment, status, order_type, table_num)
       VALUES ($1, $2, $3, $4, $5, $6, 0, 'online', NULL) RETURNING *`,
      [JSON.stringify(lines), total, customerName.trim(), customerPhone.trim(), note ?? '', payment === 'online' ? 'online' : 'store']
    );
    res.status(201).json(rowToOrder(result.rows[0]));
  })
);

ordersRouter.post(
  '/pos',
  ah(async (req, res) => {
    const { items, orderType, table, note } = req.body;
    const lines = await buildLines(items ?? []);
    if (lines.length === 0) return res.status(400).json({ error: '尚未加入品項' });

    const isDinein = orderType === 'dinein';
    const tableNum = isDinein ? Number(table) : null;
    if (isDinein && !TABLES.includes(tableNum!)) return res.status(400).json({ error: '請選擇桌號' });

    if (isDinein) {
      const conflict = await pool.query(
        "SELECT 1 FROM orders WHERE status < $1 AND order_type = 'dinein' AND table_num = $2",
        [MAX_STATUS, tableNum]
      );
      if ((conflict.rowCount ?? 0) > 0) return res.status(400).json({ error: '此桌已有進行中的訂單' });
    }

    const total = lines.reduce((n, l) => n + l.lineTotal, 0);
    const customerName = isDinein ? `內用 ${tableNum} 桌` : '現場外帶客人';
    const result = await pool.query(
      `INSERT INTO orders (items, total, customer_name, customer_phone, note, payment, status, order_type, table_num)
       VALUES ($1, $2, $3, '—', $4, 'store', 0, $5, $6) RETURNING *`,
      [JSON.stringify(lines), total, customerName, note ?? '', isDinein ? 'dinein' : 'takeout', tableNum]
    );
    res.status(201).json(rowToOrder(result.rows[0]));
  })
);

ordersRouter.patch(
  '/:id/advance',
  ah(async (req, res) => {
    const result = await pool.query(
      `UPDATE orders SET
         status = LEAST(status + 1, $2),
         served_at = CASE WHEN LEAST(status + 1, $2) >= 2 THEN COALESCE(served_at, now()) ELSE served_at END,
         completed_at = CASE WHEN LEAST(status + 1, $2) >= $2 THEN COALESCE(completed_at, now()) ELSE completed_at END
       WHERE id = $1 RETURNING *`,
      [req.params.id, MAX_STATUS]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: '訂單不存在' });
    res.json(rowToOrder(result.rows[0]));
  })
);

ordersRouter.patch(
  '/:id/clear',
  ah(async (req, res) => {
    const result = await pool.query(
      `UPDATE orders SET
         status = $2,
         served_at = COALESCE(served_at, now()),
         completed_at = COALESCE(completed_at, now())
       WHERE id = $1 RETURNING *`,
      [req.params.id, MAX_STATUS]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: '訂單不存在' });
    res.json(rowToOrder(result.rows[0]));
  })
);
