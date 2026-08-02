-- 003_audit_logs.sql
-- 建立 audit log 系統，記錄所有資料表異動

-- 1. 建立 audit_logs 表
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_changed_at ON audit_logs(changed_at DESC);

-- 2. 為現有資料表加上 updated_at 欄位
ALTER TABLE menu_items ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE orders ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE settings ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. 建立通用 audit trigger 函式
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  old_data JSONB;
  new_data JSONB;
  changed_fields TEXT[];
  record_id_value TEXT;
BEGIN
  -- 取得 record_id（優先用 id，settings 表用固定值 '1'）
  IF TG_TABLE_NAME = 'settings' THEN
    record_id_value := '1';
  ELSIF TG_OP = 'DELETE' THEN
    record_id_value := OLD.id::TEXT;
  ELSE
    record_id_value := NEW.id::TEXT;
  END IF;

  -- 準備資料
  IF TG_OP = 'DELETE' THEN
    old_data := to_jsonb(OLD);
    new_data := NULL;
    changed_fields := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    old_data := NULL;
    new_data := to_jsonb(NEW);
    changed_fields := NULL;
  ELSE -- UPDATE
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    -- 找出變更的欄位
    SELECT array_agg(key)
    INTO changed_fields
    FROM jsonb_each(new_data)
    WHERE new_data->key IS DISTINCT FROM old_data->key;
  END IF;

  -- 寫入 audit log
  INSERT INTO audit_logs (table_name, record_id, operation, old_data, new_data, changed_fields)
  VALUES (TG_TABLE_NAME, record_id_value, TG_OP, old_data, new_data, changed_fields);

  -- 更新 updated_at（DELETE 不需要）
  IF TG_OP != 'DELETE' THEN
    NEW.updated_at := NOW();
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. 為各資料表建立 trigger（BEFORE 觸發，可以攔截並更新 updated_at）
CREATE TRIGGER audit_menu_items
  BEFORE INSERT OR UPDATE OR DELETE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_orders
  BEFORE INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_users
  BEFORE INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_settings
  BEFORE INSERT OR UPDATE OR DELETE ON settings
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- 5. 初始化現有資料的 updated_at（設為 created_at 或 NOW()）
UPDATE menu_items SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE orders SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE users SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE settings SET updated_at = NOW() WHERE updated_at IS NULL;
