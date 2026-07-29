import { Router } from 'express';
import { pool } from '../db';
import { config, TABLES } from '../config';
import { ah } from '../asyncHandler';
import { requirePermission, requireStaffAuth } from '../auth';
import { getStoreOpen } from '../settings';
import type { CartItemInput, MenuItem, Order, OrderChannel, OrderLine } from '../types';

const ORDER_CHANNELS: OrderChannel[] = ['walkin', 'ig'];

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
    channel: row.channel,
    pickupDate: row.pickup_date,
    pickupTime: row.pickup_time,
    createdAt: row.created_at,
    servedAt: row.served_at,
    completedAt: row.completed_at,
  };
}

async function buildLines(cartItems: CartItemInput[]): Promise<OrderLine[]> {
  if (cartItems.length === 0) return [];
  const ids = cartItems.map((c) => c.id);
  const result = await pool.query(
    'SELECT id, zh, price, category, has_temp AS "hasTemp", sold_out AS "soldOut", enabled FROM menu_items WHERE id = ANY($1)',
    [ids]
  );
  const menuById = new Map<string, MenuItem>(result.rows.map((r: any) => [r.id, r]));
  const lines: OrderLine[] = [];
  for (const cartItem of cartItems) {
    const item = menuById.get(cartItem.id);
    if (!item || item.soldOut || !item.enabled || cartItem.qty <= 0) continue;
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
const HISTORY_PAGE_SIZE = 20;

ordersRouter.get(
  '/',
  requireStaffAuth,
  ah(async (req, res) => {
    const scope = req.query.scope === 'history' ? 'history' : req.query.scope === 'scheduled' ? 'scheduled' : 'active';
    if (scope === 'history') {
      const page = Math.max(1, Number(req.query.page) || 1);
      const offset = (page - 1) * HISTORY_PAGE_SIZE;
      const result = await pool.query(
        `SELECT *, COUNT(*) OVER() AS total_count FROM orders
         WHERE status = $1
           AND completed_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Taipei') AT TIME ZONE 'Asia/Taipei'
         ORDER BY completed_at DESC
         LIMIT $2 OFFSET $3`,
        [MAX_STATUS, HISTORY_PAGE_SIZE, offset]
      );
      const total = result.rows[0] ? Number(result.rows[0].total_count) : 0;
      return res.json({
        orders: result.rows.map(rowToOrder),
        page,
        pageSize: HISTORY_PAGE_SIZE,
        total,
        totalPages: Math.max(1, Math.ceil(total / HISTORY_PAGE_SIZE)),
      });
    }
    if (scope === 'scheduled') {
      // 取餐日在未來的訂單，讓店家能確認預先輸入的訂單有沒有存成功
      const result = await pool.query(
        `SELECT * FROM orders
         WHERE status < $1
           AND pickup_date > to_char(now() AT TIME ZONE 'Asia/Taipei', 'YYYY-MM-DD')
         ORDER BY pickup_date ASC, pickup_time ASC NULLS LAST, id ASC`,
        [MAX_STATUS]
      );
      return res.json(result.rows.map(rowToOrder));
    }
    // 訂單可能預先建立、取餐日在未來；還沒到取餐日的訂單先不進佇列，等當天自然出現
    const result = await pool.query(
      `SELECT * FROM orders
       WHERE status < $1
         AND (pickup_date IS NULL OR pickup_date <= to_char(now() AT TIME ZONE 'Asia/Taipei', 'YYYY-MM-DD'))
       ORDER BY id ASC`,
      [MAX_STATUS]
    );
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
    if (!(await getStoreOpen())) return res.status(400).json({ error: '本日公休，暫停線上點餐' });
    const { items, orderType, table, customerName, customerPhone, note, payment, pickupDate, pickupTime } = req.body;
    const lines = await buildLines(items ?? []);
    if (lines.length === 0) return res.status(400).json({ error: '購物車是空的' });

    const isDinein = orderType === 'dinein';
    const tableNum = isDinein ? Number(table) : null;
    if (isDinein && !TABLES.includes(tableNum!)) return res.status(400).json({ error: '請選擇桌號' });
    if (!isDinein && !customerPhone?.trim()) return res.status(400).json({ error: '請填寫聯絡電話' });

    if (isDinein) {
      const conflict = await pool.query(
        "SELECT 1 FROM orders WHERE status < $1 AND order_type = 'dinein' AND table_num = $2",
        [MAX_STATUS, tableNum]
      );
      if ((conflict.rowCount ?? 0) > 0) return res.status(400).json({ error: '此桌已有進行中的訂單，請洽店內人員為你加點' });
    }

    const total = lines.reduce((n, l) => n + l.lineTotal, 0);
    const name = isDinein ? `內用 ${tableNum} 桌` : customerName?.trim() || '外帶客人';
    const phone = isDinein ? '—' : customerPhone.trim();
    const result = await pool.query(
      `INSERT INTO orders (items, total, customer_name, customer_phone, note, payment, status, order_type, table_num, pickup_date, pickup_time)
       VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, $9, $10) RETURNING *`,
      [
        JSON.stringify(lines),
        total,
        name,
        phone,
        note ?? '',
        payment === 'online' ? 'online' : 'store',
        isDinein ? 'dinein' : 'online',
        tableNum,
        !isDinein && pickupDate ? String(pickupDate) : null,
        !isDinein && pickupTime ? String(pickupTime) : null,
      ]
    );
    res.status(201).json(rowToOrder(result.rows[0]));
  })
);

ordersRouter.post(
  '/pos',
  requireStaffAuth,
  ah(async (req, res) => {
    const { items, orderType, table, note, channel, pickupDate, pickupTime } = req.body;
    const lines = await buildLines(items ?? []);
    if (lines.length === 0) return res.status(400).json({ error: '尚未加入品項' });

    const isDinein = orderType === 'dinein';
    const tableNum = isDinein ? Number(table) : null;
    if (isDinein && !TABLES.includes(tableNum!)) return res.status(400).json({ error: '請選擇桌號' });
    if (!isDinein && !ORDER_CHANNELS.includes(channel)) return res.status(400).json({ error: '請選擇外帶通路' });

    // POS 允許同桌加點：不檢查該桌是否已有進行中訂單（顧客自行下單那邊仍然檢查，見上面 POST /）
    const total = lines.reduce((n, l) => n + l.lineTotal, 0);
    const customerName = isDinein ? `內用 ${tableNum} 桌` : '現場外帶客人';
    const result = await pool.query(
      `INSERT INTO orders (items, total, customer_name, customer_phone, note, payment, status, order_type, table_num, channel, pickup_date, pickup_time)
       VALUES ($1, $2, $3, '—', $4, 'store', 0, $5, $6, $7, $8, $9) RETURNING *`,
      [
        JSON.stringify(lines),
        total,
        customerName,
        note ?? '',
        isDinein ? 'dinein' : 'takeout',
        tableNum,
        isDinein ? null : channel,
        channel === 'ig' && pickupDate ? String(pickupDate) : null,
        channel === 'ig' && pickupTime ? String(pickupTime) : null,
      ]
    );
    res.status(201).json(rowToOrder(result.rows[0]));
  })
);

ordersRouter.patch(
  '/:id/advance',
  requireStaffAuth,
  ah(async (req, res) => {
    const result = await pool.query(
      `UPDATE orders SET
         status = CASE WHEN order_type <> 'dinein' AND LEAST(status + 1, $2) >= 2 THEN $2 ELSE LEAST(status + 1, $2) END,
         served_at = CASE WHEN LEAST(status + 1, $2) >= 2 THEN COALESCE(served_at, now()) ELSE served_at END,
         completed_at = CASE WHEN LEAST(status + 1, $2) >= $2 OR (order_type <> 'dinein' AND LEAST(status + 1, $2) >= 2) THEN COALESCE(completed_at, now()) ELSE completed_at END
       WHERE id = $1 RETURNING *`,
      [req.params.id, MAX_STATUS]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: '訂單不存在' });
    res.json(rowToOrder(result.rows[0]));
  })
);

ordersRouter.patch(
  '/:id/clear',
  requireStaffAuth,
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

ordersRouter.patch(
  '/table/:tableNum/clear',
  requireStaffAuth,
  ah(async (req, res) => {
    const tableNum = Number(req.params.tableNum);
    if (!TABLES.includes(tableNum)) return res.status(400).json({ error: '桌號不存在' });
    const result = await pool.query(
      `UPDATE orders SET
         status = $2,
         served_at = COALESCE(served_at, now()),
         completed_at = COALESCE(completed_at, now())
       WHERE order_type = 'dinein' AND table_num = $1 AND status < $2
       RETURNING *`,
      [tableNum, MAX_STATUS]
    );
    res.json(result.rows.map(rowToOrder));
  })
);

ordersRouter.delete(
  '/:id',
  requirePermission('admin'),
  ah(async (req, res) => {
    const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: '訂單不存在' });
    res.json({ ok: true });
  })
);
