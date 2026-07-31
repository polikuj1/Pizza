import { reactive, watch } from 'vue';

// v2：key 改成品項內容（id+溫度+起司）而非 index/id，版本升級讓舊格式資料不會被誤讀
const STORAGE_KEY = 'checkedItems:v2';

function loadInitial(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// 出餐勾選狀態存 localStorage，重新整理頁面/切換頁面不會清空；跨分頁不同步
export const checkedItemsState = reactive<Record<string, boolean>>(loadInitial());

watch(
  checkedItemsState,
  (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // 私密瀏覽模式或容量爆滿時放棄持久化，不影響當次使用
    }
  },
  { deep: true }
);

// lineKey 用 presentation.ts 的 orderLineKey(item) 產生，而非 menu item id——同一張訂單可能有兩行相同 id、不同溫度的品項（如拿鐵冰/熱），id 不是唯一的
export function itemKey(orderId: number, lineKey: string): string {
  return `${orderId}-${lineKey}`;
}

export function isItemChecked(orderId: number, lineKey: string): boolean {
  return !!checkedItemsState[itemKey(orderId, lineKey)];
}

export function toggleItem(orderId: number, lineKey: string): void {
  const key = itemKey(orderId, lineKey);
  checkedItemsState[key] = !checkedItemsState[key];
}

export function clearOrderItems(orderId: number): void {
  const prefix = `${orderId}-`;
  for (const key of Object.keys(checkedItemsState)) {
    if (key.startsWith(prefix)) delete checkedItemsState[key];
  }
}
