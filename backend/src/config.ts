import 'dotenv/config';

export { PERMISSIONS, type Permission } from './shared/types';

export const config = {
  cheeseUpcharge: Number(process.env.CHEESE_UPCHARGE ?? 50),
  pickupEstimateMinutes: Number(process.env.PICKUP_ESTIMATE_MINUTES ?? 20),
};

export const CATEGORIES = [
  { id: 'pizza', label: 'Pizza' },
  { id: 'drinks', label: 'Drinks' },
  { id: 'snacks', label: 'Snacks' },
];

export const TABLES = [1, 2, 3, 4, 5];

// 「這筆訂單算數」的唯一定義：付款流程沒卡住的訂單。線上付款尚未完成（pending）或失敗（failed）、
// 已退款（refunded）的訂單不進出餐佇列、也不計入統計。到店付款一律是 'none'，永遠算數。
// 直接內嵌進 SQL（無參數化）：這是寫死的常數字串，沒有外部輸入。
export const COUNTED_ORDER = "payment_status IN ('none', 'paid')";
