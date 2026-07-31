-- 訂單付款狀態：記錄訂單是否已付款（目前僅支援到店付款，預設未付款）
ALTER TABLE orders ADD COLUMN paid BOOLEAN NOT NULL DEFAULT FALSE;
