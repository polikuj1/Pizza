-- IG 通路可選填客人約定的取餐時間，存 "HH:MM" 字串（不涉及日期/時區）
ALTER TABLE orders ADD COLUMN pickup_time TEXT;
