-- 取餐日期，跟 pickup_time 一樣存 "YYYY-MM-DD" 字串（不用 DATE 型別，避免 pg 用伺服器時區轉換 JS Date 造成誤差）
-- 訂單可能預先建立、取餐日在未來；NULL 代表「今天／立即」，訂單佇列查詢會用這欄位濾掉還沒到取餐日的訂單
ALTER TABLE orders ADD COLUMN pickup_date TEXT;
