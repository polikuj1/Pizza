# 披薩救星訂餐系統

Vue 3 + TypeScript 前端、Node.js (Express) + TypeScript 後端、PostgreSQL 資料庫。
由 HTML/JS prototype（`訂餐系統網站設計.zip`）轉換而來。

## 前端 (frontend/)

Vite + Vue 3 + TypeScript，vue-router 分頁，無 Pinia（購物車/菜單用 `reactive()` singleton store 即可）。

- `src/types.ts` — `MenuItem`/`OrderLine`/`OrderChannel`/`Order`/`Permission`/`CartItemInput` 是 `import type ... from '../../backend/src/shared/types'` 引用後端的共用型別（不是重複手刻），其餘（`Cart`、`AppConfig`、`StatsSummary` 等前端專用型別）留在這個檔案
- `src/router.ts` — 路由定義；`beforeEach` 除了員工權限守衛，也會在進入 `/checkout` 前確保 catalog 已載入，公休/暫停點餐（`catalog.config.storeOpen === false`）時導回 `/`
- `src/store/cart.ts` — 購物車狀態（`cartState.cart`, `cartState.cartOpen`）與加減/加起司/冰熱操作。`Cart` 用 `cartKey(itemId, temp)` 當 key（`CartLineState` 存 `itemId`），有 `hasTemp` 的品項冰/熱各自是獨立一行，同一品項可以同時加冰的跟熱的、數量各自累加；`addToCart(cart, itemId, temp?)` 依 `temp` 決定寫入哪個 key
- `src/store/catalog.ts` — 菜單與設定（`/api/menu`, `/api/config`）的載入與快取，`loadCatalog()` 是 cache 過的 promise，整個分頁只會真正打一次（`AdminView` 例外，見下方）
- `src/store/checkedItems.ts` — 出餐勾選狀態（AdminView 用），存 `localStorage`（key: `checkedItems:v2`）。用 `orderLineKey(item)`（`presentation.ts`，`item.id:temp:cheese` 組合）識別每一行品項，不是用 index 或單純 id——同一訂單可能有兩行 id 相同、溫度不同的品項（如拿鐵冰/熱），這個組合在單一訂單內保證唯一且不受陣列位置影響
- `src/composables/presentation.ts` — 純函式：狀態標籤/顏色、訂單類型顯示、購物車明細計算、`orderLineKey(item)`
- `src/composables/authGuard.ts` — 輪詢/操作遇到 401 時導回 `/login`
- `src/store/auth.ts` — 登入狀態（`authState.authenticated`），`ensureAuthChecked()` / `login()` / `logout()`
- `src/api.ts` — 後端 API 呼叫（fetch 封裝，`credentials: 'include'` 帶 cookie）

### 頁面

| 路徑 | 元件 | 權限 | 功能 |
|---|---|---|---|
| `/` | MenuView | 公開 | 顧客菜單，分類（Pizza/Drinks/Snacks）、加起司選項、冰/熱選擇（各自獨立加入購物車）、加入購物車。公休/暫停點餐時（`storeOpen=false`）不顯示加入購物車按鈕與數量調整，只留價格 |
| `/checkout` | CheckoutView | 公開 | 結帳表單，先選內用／外帶：內用選桌號（免姓名電話，選已有進行中訂單的桌號會被拒絕——加點僅開放 POS，顧客端不行），外帶填姓名（選填）／電話（必填）；備註選填；付款方式目前僅到店付款（線上付款先隱藏，UI 未提供切換）。送出後建立訂單並導向追蹤頁。公休/暫停點餐時進不去，路由守衛會導回 `/` |
| `/order/:id` | TrackingView | 公開 | 訂單追蹤，4 階段進度條，每 5 秒輪詢狀態 |
| `/login` | LoginView | 公開 | 員工登入 |
| `/admin` | AdminView | `admin` 權限 | 當日訂單佇列（已接單／製作中兩欄，製作中依下單時間由舊到新排、方便照順序出餐；取餐日在未來的訂單不會出現）＋已排程訂單列表（取餐日未到的訂單，供確認是否存成功，可編輯垃圾桶圖示刪除整筆訂單），可推進狀態、勾選品項已出餐，每 5 秒輪詢 |
| `/pos` | PosView | `pos` 權限 | 現場點餐：內用選桌號 / 外帶，送出後建立訂單。內用選到已有進行中訂單的桌號視為「加點」，不會被擋（紅點標示佔用中的桌號） |
| `/tables` | TablesView | `tables` 權限 | 5 桌桌況總覽，依現場實際相對位置排列（前面 1、2 桌＋吧檯；後面 3、4 桌＋5 桌圓桌）。同一桌可能有多筆進行中訂單（加點，依下單順序顯示、第 2 筆起標「加點 #N」），各自可推進狀態；「結束用餐」一次清空該桌所有進行中訂單。點卡片上的桌號（有訂單時）跳出換桌彈窗，整桌訂單一起搬到空桌（佔用中的桌號在彈窗裡是 disabled，後端也會擋） |
| `/history` | HistoryView | `history` 權限 | 已完成訂單歷史紀錄，可切換今日／昨天／自訂區間（自訂需按「查詢」才送出），依 `completed_at` 過濾 |
| `/menu-admin` | MenuAdminView | `menu` 權限 | 菜單管理：新增品項、調整價格/分類/描述、設定完售狀態、停用／啟用品項（永久下架的軟刪除切換） |
| `/users` | UsersView | `users` 權限 | 頁首有「顧客線上點餐」開關（切換 `storeOpen`，即時生效）。帳號管理：新增帳號、勾選各頁面權限、改密碼、刪除 |
| `/stats` | StatsView | `stats` 權限 | 統計分析：頁首的當日／一週／一個月／自訂區間切換器同時驅動上方三張總覽卡（總營收／所有訂單數／來店數）與下方三張圖；自訂區間選起訖日期後需按「查詢」才送出，不會即時抓資料），營收趨勢（折線）、內用/現場外帶/線上外帶佔比（環圈圖）、品項銷售排行（依銷售數量，水平長條圖，可切換「全部／Pizza／Drinks／Snacks」篩選，只影響這張圖）。圖表套件用 Chart.js + vue-chartjs（lazy-loaded，只有進這頁才會載入） |

購物車、菜單資料為前端 in-memory 狀態，重新整理頁面會清空（與原始 prototype 行為一致，未做 localStorage 持久化）。

### 權限

`meta.staff` 存的是該頁需要的權限 key（`'admin' | 'pos' | 'tables' | 'history' | 'menu' | 'users' | 'stats'`，見 `src/types.ts` 的 `Permission`）。`router.beforeEach`（`src/router.ts`）攔截有 `meta.staff` 的路由：未登入（`ensureAuthChecked()` 呼叫 `GET /api/auth/me`）導向 `/login?redirect=<原路徑>`；登入但缺該權限則導回 `/admin`。登入狀態與權限清單存在單一 reactive singleton（`authState`，見 `src/store/auth.ts`），整個分頁生命週期只查一次 `/api/auth/me`，之後遇到 401（session 過期）才會再次導回登入頁（見 `authGuard.ts`）。`AppHeader` 的分頁籤（`tabs`）依 `hasPermission()` 過濾，只顯示使用者有權限的頁面。

## 後端 (backend/)

Express + TypeScript，直接用 `pg` 下 SQL（無 ORM）。

- `src/shared/types.ts` — **前後端共用型別**（`MenuItem`、`OrderLine`、`OrderChannel`、`Order`、`CartItemInput`、`Permission`/`PERMISSIONS`）。物理上放在 `backend/src/` 底下是刻意的：後端用 `tsc` 真的把檔案編譯進 `dist/`，`rootDir: "src"` 要求所有原始檔在 `src/` 之下；前端是 `noEmit`（Vite 負責打包，不受 rootDir 限制），可以自由用相對路徑跨資料夾 import——`frontend/src/types.ts` 直接 `import type ... from '../../backend/src/shared/types'` 引用同一份定義，不再各自手刻一份。前後端分別部署在 Cloudflare／Render 不影響這個做法：兩邊建置時都是先 clone 整個 git repo，再各自進到 `frontend`/`backend` 跑指令，`shared/` 檔案本來就在 repo 裡，不需要额外的 npm workspace 或發布套件
- `src/types.ts` — barrel，`export type {...} from './shared/types'`，backend 內部沿用 `from '../types'` 的既有 import 路徑不用全部改
- `src/db.ts` — PostgreSQL connection pool
- `src/config.ts` — 靜態營運設定常數（`cheeseUpcharge`、`pickupEstimateMinutes`）、`CATEGORIES`、`TABLES`；`PERMISSIONS`/`Permission` re-export 自 `shared/types.ts`。`storeOpen` 不在這裡，見 `src/settings.ts`
- `src/settings.ts` — `getStoreOpen()` / `setStoreOpen(open)`，讀寫 `settings` 資料表（單一列，是否開放顧客線上點餐），可在後台即時切換、不用重啟服務
- `src/auth.ts` — 登入 session 簽發/驗證（Node `crypto` HMAC 簽名 cookie，無 JWT 套件）、密碼雜湊（`crypto.scrypt`，無 bcrypt 套件）、`requireStaffAuth`（任何已登入員工）、`requirePermission(key)`（需具備特定權限，查 DB）middleware
- `src/routes/config.ts`、`src/routes/menu.ts`、`src/routes/orders.ts`、`src/routes/auth.ts`、`src/routes/users.ts`、`src/routes/stats.ts` — API 路由
- `migrations/*.sql` — 依編號序執行（`migrate.ts` 沒有已套用紀錄，只適合對全新資料庫從頭跑一次；後續新增的 migration 要手動對既有資料庫單獨執行）。`001_init.sql` 是資料表建立與菜單種子資料，之後每支檔案對應一次 schema 異動

### 資料表

- `menu_items` — 菜單品項（id, zh, en, description, price, category, has_temp, sold_out, enabled）。`id` 是英文 slug（如 `margherita`），當自然鍵用，非代理鍵；購物車與訂單都用這個字串識別品項。`sold_out` 為 true 時，顧客端/POS 端不能再加入購物車，後端下單也會直接濾掉該品項——這是「今天賣完了，明天還會賣」的暫時狀態。`enabled` 是永久下架用的軟刪除欄位（預設 `true`），為 `false` 時顧客菜單／POS 完全不顯示（前端過濾），後端下單也會擋掉；菜單管理頁每列的「停用／啟用」切換按鈕就是改這個欄位（走 `PATCH /api/menu/:id`，無確認對話框，不會真的移除資料列，隨時可以切回來）
- `orders` — 訂單，`items` 為 JSONB 快照（下單當下計算好的明細，含當時的 `menu_items.id`），`id` 從 1001 起跳。快照不會回頭查 `menu_items`，改菜單不影響歷史訂單。`channel` 只用在 POS 建立的外帶訂單（`walkin` 現場／`ig` IG 私訊等店家手動輸入），內用與線上訂單一律是 `NULL`——`order_type` 決定出餐流程，`channel` 只是訂單來源，兩者刻意分開。`pickup_date`/`pickup_time` 皆為 `TEXT`（`"YYYY-MM-DD"`/`"HH:MM"`，非 DATE/TIME 型別，避免 pg 用伺服器時區轉換），外帶（`takeout`/`online`）才會用到，皆可為 `NULL`；`NULL` 的 `pickup_date` 代表「今天／立即」。訂單可能預先建立、取餐日在未來——`GET /api/orders?scope=active` 會濾掉 `pickup_date` 還沒到的訂單，等當天自然出現在佇列。`payment_status`（`none`/`pending`/`paid`/`failed`/`refunded`，預設 `none`）是線上金流狀態，為未來串接金流預留——目前系統只有到店付款，所有訂單都是 `none`；只有 `none`/`paid` 的訂單會進出餐佇列與統計（定義在 `config.ts` 的 `COUNTED_ORDER`，`orders.ts` 的 `active`/`scheduled` 與 `stats.ts` 的四支 query 共用同一個字串）。**不要跟 `paid` 布林欄位搞混**：`paid` 是店員在 POS 手動勾的「現場已收錢」，`payment_status` 是金流商回報的交易狀態，兩者不可互相推導
- `users` — 員工帳號（id, username, password_hash, permissions, created_at）。`password_hash` 格式為 `<salt>:<hash>`（`crypto.scrypt`）；`permissions` 為 `TEXT[]`，值對應前端路由 `meta.staff` 的權限 key
- `settings` — 全站營運設定，固定只有一列（`id` 恆為 1，`CHECK (id = 1)` 保證單列）。目前只有 `store_open`（是否開放顧客線上點餐），未來若有更多全站開關可以加欄位到同一列

### API

| Method | 路徑 | 說明 |
|---|---|---|
| GET | `/api/health` | 回傳 `{ok: true}`，純存活檢查，不接資料庫；供外部排程（如 GitHub Actions）定時呼叫，避免免費方案閒置 sleep |
| GET | `/api/config` | 回傳 `{cheeseUpcharge, pickupEstimateMinutes, storeOpen}`，`storeOpen` 讀自 `settings` 表（即時值） |
| PATCH | `/api/config` 🔐users | `{storeOpen}`，切換是否開放顧客線上點餐，寫回 `settings` 表 |
| GET | `/api/menu` | 回傳 `{items, categories}`，`items` 含 `soldOut` |
| POST | `/api/menu` 🔐menu | 新增品項 `{id, zh, en, description, price, category, hasTemp, soldOut}` |
| PATCH | `/api/menu/:id` 🔐menu | 調整品項（同上欄位，`id` 不可變） |
| GET | `/api/orders?scope=active\|scheduled\|history` 🔒 | `active`：進行中且取餐日已到（或無取餐日）；`scheduled`：進行中但取餐日在未來（依取餐日期時間排序）；`history`：已完成，`?page=` 分頁（每頁 20 筆），可加 `?start=&end=`（`YYYY-MM-DD`，含頭尾，依 `completed_at` 台北時區日期過濾），未帶或格式不合法時只回傳當天完成的訂單 |
| GET | `/api/orders/:id` | 單筆訂單（追蹤頁用，顧客免登入查自己的訂單） |
| POST | `/api/orders` | 顧客線上下單。內用需選桌號（`order_type='dinein'`，並檢查該桌是否已有進行中訂單——顧客端不能加點，只能等桌況清空或洽店員，姓名/電話免填）；外帶（`order_type='online'`）電話必填、姓名選填。驗證：品項存在、購物車非空、公休時拒單。價格一律由後端依 `menu_items` 重新計算，不信任前端 |
| POST | `/api/orders/pos` 🔒 | 現場 POS 下單。內用選桌號**不會**檢查該桌是否已有進行中訂單——同桌可以累積多筆（加點），無上限；外帶需選 `channel`（`walkin`/`ig`） |
| PATCH | `/api/orders/:id/advance` 🔒 | 狀態 +1（上限 3）；跨過 2/3 時自動補 `served_at`/`completed_at`。外帶／線上訂單從「製作中」推進會直接跳到「已完成」（略過「餐點已出」），`served_at`/`completed_at` 用同一個 `now()` 寫入、兩者時間相同；內用訂單仍只能推進到「餐點已出」 |
| PATCH | `/api/orders/:id/clear` 🔒 | 直接設為已完成（單筆訂單） |
| PATCH | `/api/orders/table/:tableNum/move` 🔒 | `{to}`，換桌：一個 `UPDATE` 把該桌所有 `status<3` 的內用訂單搬到 `to` 桌（同時改寫 `customer_name`）。目標桌必須是空桌，已有進行中訂單則回 400（不做合併） |
| PATCH | `/api/orders/table/:tableNum/clear` 🔒 | 一次把該桌所有 `status<3` 的內用訂單設為已完成（桌況頁「結束用餐・清空整桌」用，一個 `UPDATE` 原子操作，取代逐筆呼叫上面那支） |
| DELETE | `/api/orders/:id` 🔐admin | 硬刪除，整列移除（已排程訂單列表的垃圾桶用；跟 `menu_items`/`users` 的軟刪除不同，訂單沒有其他地方引用它） |
| POST | `/api/auth/login` | `{username, password}`，帳密核對 `users` 表，成功後設定 httpOnly session cookie，回傳 `{ok, permissions}` |
| POST | `/api/auth/logout` | 清除 session cookie |
| GET | `/api/auth/me` | 回傳 `{authenticated, permissions}` |
| GET | `/api/users` 🔐users | 帳號列表 |
| POST | `/api/users` 🔐users | 新增帳號 `{username, password, permissions}` |
| PATCH | `/api/users/:id` 🔐users | 改密碼／權限（欄位可省略，省略則保留原值） |
| DELETE | `/api/users/:id` 🔐users | 刪除帳號 |
| GET | `/api/stats/summary?range=day\|week\|month\|custom&start=YYYY-MM-DD&end=YYYY-MM-DD&itemCategory=pizza\|drinks\|snacks` 🔐stats | 統計摘要：`revenue.buckets`（依 `created_at` 分桶，`day` 用當日 24 小時、`week`/`month`/`custom` 用每日）、`orderTypes.breakdown`（`dinein`/`takeout`/`online` 各自的營收與訂單數）、`itemRanking.items`（依銷售數量排序前 20 名，讀 `orders.items` JSONB 快照 LEFT JOIN `menu_items` 取得目前分類；`itemCategory` 可篩選只看該分類，未帶或不合法視為全部；只影響這個排行，不影響前兩者）。`custom` 需帶 `start`/`end`（皆為 `YYYY-MM-DD`，含頭尾，起始不可晚於結束）；回應一律附帶 `startDate`/`endDate`/`itemCategory`。統計涵蓋所有 status（無取消狀態，進行中訂單也算已承諾營收） |

🔒 = 需要 `requireStaffAuth`（帶有效 session cookie，任何員工皆可）
🔐`<permission>` = 需要 `requirePermission('<permission>')`（僅具該權限的員工）

### 每日自動結案（pg_cron）

正式環境的 Postgres 是 Supabase，用 `pg_cron` 排了一個 job（`close-day-orders`，見 `migrations/010_close_day_cron.sql`）：每天台北 23:59（cron 表達式是 UTC 的 `59 15 * * *`）把所有 `status < 3` 的訂單設為 3（已完成），`served_at`/`completed_at` 用當下時間補上，所以時間戳記落在當天；同時在 `note` 寫入「系統自動結單」（原本有備註則以「・」接在後面），方便事後分辨哪些是人工結案、哪些是排程掃掉的。`pickup_date` 在未來的預約單排除，不會被提前結案。排程執行在資料庫端，與後端服務是否閒置無關。查執行紀錄：`select * from cron.job_run_details order by start_time desc limit 10;`

### 狀態機

`0 已接單 → 1 製作中 → 2 餐點已出 → 3 已完成`

內用（dinein）訂單在管理介面只能推進到 2（餐點已出），之後要靠 `/clear`（單筆）或 `/table/:tableNum/clear`（整桌）結束用餐；外帶（takeout）／線上（online）訂單從「製作中」推進會直接跳到 3（略過「餐點已出」，`served_at`/`completed_at` 同一時間寫入）。

同一桌可以有多筆進行中的內用訂單（POS 加點，無上限），各自獨立跑狀態機；顧客自行下單（`/checkout`）仍然一桌只能一筆進行中訂單，不能加點。

### 員工登入

帳密存在 `users` 表，密碼以 `crypto.scrypt` 雜湊（非明文、非套件 bcrypt）。登入成功後簽發 httpOnly cookie（`staff_session`，12 小時效期，內容為 `<userId>.<expiresAt>.<hmac 簽章>`，`SESSION_SECRET` 需在正式環境更換）。`requirePermission(key)` 從 cookie 解出 `userId` 後查 DB 取即時權限（權限變更立即生效，不用重新登入）。種子帳號 `staff`（密碼見團隊內部密碼管理工具，或 `migrations/002_users.sql` 建置當下的紀錄）擁有全部權限，正式環境上線前務必更換密碼。

Cookie 屬性依 `NODE_ENV` 切換（`routes/auth.ts` 的 `SESSION_COOKIE_OPTIONS`）：本機開發是 `sameSite: 'lax'`／`secure: false`；`NODE_ENV=production` 時自動變成 `sameSite: 'none'`／`secure: true`，供前後端部署在不同網域時使用。

## 啟動

見 [README.md](README.md)。
