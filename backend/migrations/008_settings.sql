-- 全站營運設定，單一列（id 固定為 1）。目前只存「是否開放顧客點餐」，原本是 STORE_OPEN 環境變數，
-- 現在改成資料庫存值，可以在後台即時切換，不用重啟服務。
CREATE TABLE settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_open BOOLEAN NOT NULL DEFAULT TRUE
);
INSERT INTO settings (id, store_open) VALUES (1, TRUE);
