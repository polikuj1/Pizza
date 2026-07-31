import { Router } from 'express';
import { pool } from '../db';
import { ah } from '../asyncHandler';
import { requirePermission } from '../auth';
import { CATEGORIES } from '../config';

export const statsRouter = Router();

type StatsRange = 'day' | 'week' | 'month' | 'custom';
const ORDER_TYPES = ['dinein', 'takeout', 'online'];
const CATEGORY_IDS = CATEGORIES.map((c) => c.id);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseRange(q: unknown): StatsRange {
  if (q === 'week') return 'week';
  if (q === 'month') return 'month';
  if (q === 'custom') return 'custom';
  return 'day';
}

// 未帶或帶到不合法的分類一律視為「全部」，不特別回錯
function parseItemCategory(q: unknown): string | null {
  return typeof q === 'string' && CATEGORY_IDS.includes(q) ? q : null;
}

// 台灣沒有 DST，純日曆日期加減不會有時區誤差
function todayTaipei(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });
}

function daysAgoTaipei(daysBack: number): string {
  const [y, m, d] = todayTaipei().split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - daysBack);
  return dt.toISOString().slice(0, 10);
}

async function queryRevenueDay() {
  const result = await pool.query(`
    WITH hours AS (SELECT generate_series(0, 23) AS h),
    filtered AS (
      SELECT date_part('hour', created_at AT TIME ZONE 'Asia/Taipei')::int AS h, total
      FROM orders
      WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Taipei') AT TIME ZONE 'Asia/Taipei'
        AND created_at < (date_trunc('day', now() AT TIME ZONE 'Asia/Taipei') AT TIME ZONE 'Asia/Taipei') + interval '1 day'
    )
    SELECT
      to_char(make_time(hours.h, 0, 0), 'HH24:00') AS label,
      NULL::text AS date,
      COALESCE(SUM(filtered.total), 0)::int AS revenue,
      COUNT(filtered.total)::int AS "orderCount"
    FROM hours LEFT JOIN filtered ON filtered.h = hours.h
    GROUP BY hours.h ORDER BY hours.h
  `);
  return result.rows;
}

async function queryRevenueRange(start: string, end: string) {
  const result = await pool.query(
    `WITH days AS (SELECT generate_series($1::date, $2::date, interval '1 day') AS day_local),
     filtered AS (
       SELECT date_trunc('day', created_at AT TIME ZONE 'Asia/Taipei') AS day_local, total
       FROM orders
       WHERE created_at >= (($1::date)::timestamp AT TIME ZONE 'Asia/Taipei')
         AND created_at < (($2::date + 1)::timestamp AT TIME ZONE 'Asia/Taipei')
     )
     SELECT
       to_char(d.day_local, 'MM/DD') AS label,
       to_char(d.day_local, 'YYYY-MM-DD') AS date,
       COALESCE(SUM(f.total), 0)::int AS revenue,
       COUNT(f.total)::int AS "orderCount"
     FROM days d LEFT JOIN filtered f ON f.day_local = d.day_local
     GROUP BY d.day_local ORDER BY d.day_local`,
    [start, end]
  );
  return result.rows;
}

async function queryOrderTypesRange(start: string, end: string) {
  const result = await pool.query(
    `WITH types AS (SELECT unnest($3::text[]) AS order_type),
     filtered AS (
       SELECT order_type, total FROM orders
       WHERE created_at >= (($1::date)::timestamp AT TIME ZONE 'Asia/Taipei')
         AND created_at < (($2::date + 1)::timestamp AT TIME ZONE 'Asia/Taipei')
     )
     SELECT
       t.order_type AS "orderType",
       COALESCE(SUM(f.total), 0)::int AS revenue,
       COUNT(f.total)::int AS "orderCount"
     FROM types t LEFT JOIN filtered f ON f.order_type = t.order_type
     GROUP BY t.order_type ORDER BY array_position($3::text[], t.order_type)`,
    [start, end, ORDER_TYPES]
  );
  return result.rows;
}

async function queryItemRankingRange(start: string, end: string, category: string | null) {
  // category 篩選要對照 menu_items 目前的分類，訂單快照本身沒有存 category；menu_items 只會軟刪除（enabled=false）
  // 不會真的移除資料列，所以歷史訂單的 item id 一定查得到對應分類
  const result = await pool.query(
    `WITH filtered AS (
       SELECT items FROM orders
       WHERE created_at >= (($1::date)::timestamp AT TIME ZONE 'Asia/Taipei')
         AND created_at < (($2::date + 1)::timestamp AT TIME ZONE 'Asia/Taipei')
     ),
     lines AS (
       SELECT elem->>'id' AS item_id, elem->>'zh' AS item_zh,
              (elem->>'qty')::int AS qty, (elem->>'lineTotal')::int AS line_total
       FROM filtered CROSS JOIN LATERAL jsonb_array_elements(filtered.items) AS elem
     )
     SELECT l.item_id AS "itemId", MAX(l.item_zh) AS zh, SUM(l.qty)::int AS qty, SUM(l.line_total)::int AS revenue
     FROM lines l
     LEFT JOIN menu_items mi ON mi.id = l.item_id
     WHERE $3::text IS NULL OR mi.category = $3
     GROUP BY l.item_id ORDER BY qty DESC LIMIT 20`,
    [start, end, category]
  );
  return result.rows;
}

statsRouter.get(
  '/summary',
  requirePermission('stats'),
  ah(async (req, res) => {
    const range = parseRange(req.query.range);
    let start: string;
    let end: string;

    if (range === 'custom') {
      const rawStart = typeof req.query.start === 'string' ? req.query.start : '';
      const rawEnd = typeof req.query.end === 'string' ? req.query.end : '';
      if (!DATE_RE.test(rawStart) || !DATE_RE.test(rawEnd)) {
        return res.status(400).json({ error: '請提供正確格式的起始與結束日期' });
      }
      if (rawStart > rawEnd) {
        return res.status(400).json({ error: '起始日期不能晚於結束日期' });
      }
      start = rawStart;
      end = rawEnd;
    } else if (range === 'day') {
      start = end = todayTaipei();
    } else {
      end = todayTaipei();
      start = daysAgoTaipei(range === 'week' ? 6 : 29);
    }

    const itemCategory = parseItemCategory(req.query.itemCategory);
    const [revenueBuckets, orderTypeBreakdown, itemRankingRows] = await Promise.all([
      range === 'day' ? queryRevenueDay() : queryRevenueRange(start, end),
      queryOrderTypesRange(start, end),
      queryItemRankingRange(start, end, itemCategory),
    ]);

    res.json({
      range,
      startDate: start,
      endDate: end,
      itemCategory,
      revenue: { buckets: revenueBuckets },
      orderTypes: { breakdown: orderTypeBreakdown },
      itemRanking: { items: itemRankingRows },
    });
  })
);
