-- 外帶訂單的來源通路（現場點單 / IG 私訊等店家手動輸入），內用與線上訂單不使用此欄位
ALTER TABLE orders ADD COLUMN channel TEXT;
