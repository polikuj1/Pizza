# 披薩救星訂餐系統

Vue 3 + TypeScript 前端、Node.js (Express) + TypeScript 後端、PostgreSQL 資料庫。

## 啟動

1. 建立資料庫並設定連線字串
   ```
   cd backend
   cp .env.example .env   # 編輯 DATABASE_URL
   npm install
   npm run migrate        # 建表並灌入菜單資料
   npm run dev             # http://localhost:3001
   ```
2. 前端
   ```
   cd frontend
   npm install
   npm run dev             # http://localhost:5173，/api 會 proxy 到後端
   ```

## 頁面

- `/` 顧客菜單、`/checkout` 結帳、`/order/:id` 訂單追蹤
- `/admin` 訂單佇列、`/pos` 現場點餐、`/tables` 桌況、`/history` 歷史訂單
