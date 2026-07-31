-- 軟刪除：刪除品項改成停用，不真的移除資料列（跟 sold_out 語意不同：sold_out 是暫時缺貨，enabled 是永久下架）
ALTER TABLE menu_items ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT TRUE;
