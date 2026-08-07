-- 線上金流狀態。'none' = 不涉及線上金流（到店付款），既有訂單與目前所有流程都是這個值。
-- 注意：與 orders.paid 是不同概念 — paid 是店員在 POS 手動勾的「現場已收錢」，
-- payment_status 是金流商回報的交易狀態，兩者不可互相推導。
ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'none'
  CHECK (payment_status IN ('none', 'pending', 'paid', 'failed', 'refunded'));
