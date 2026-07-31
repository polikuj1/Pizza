import type { AppConfig, Cart, CartItemInput, Category, MenuItem, Order, OrderChannel, OrderHistoryPage, Permission, StaffUser, StatsRange, StatsSummary } from './types';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

async function send<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  const body = await res.json();
  if (!res.ok) throw new ApiError(body.error ?? '發生錯誤', res.status);
  return body as T;
}

// 防重複送出的最後一道防線：同一把寫入請求（method + path + body 相同）還在飛的時候，
// 後續呼叫直接共用同一個 promise，不會真的再打一次。網路慢時使用者狂點也只會建立一筆。
// ponytail: 只在 in-flight 期間去重，不是 response cache；GET 不管（重複讀無害）
const inflight = new Map<string, Promise<unknown>>();

function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = options?.method ?? 'GET';
  if (method === 'GET') return send<T>(path, options);
  const key = `${method} ${path} ${String(options?.body ?? '')}`;
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const pending = send<T>(path, options).finally(() => inflight.delete(key));
  inflight.set(key, pending);
  return pending;
}

function cartToItems(cart: Cart): CartItemInput[] {
  return Object.values(cart)
    .filter((line) => line.qty > 0)
    .map((line) => ({ id: line.itemId, qty: line.qty, cheese: line.cheese, temp: line.temp }));
}

export const api = {
  getConfig: () => request<AppConfig>('/config'),
  updateConfig: (payload: { storeOpen: boolean }) => request<AppConfig>('/config', { method: 'PATCH', body: JSON.stringify(payload) }),
  getMenu: () => request<{ items: MenuItem[]; categories: Category[] }>('/menu'),
  createMenuItem: (payload: MenuItem) => request<MenuItem>('/menu', { method: 'POST', body: JSON.stringify(payload) }),
  updateMenuItem: (id: string, payload: Omit<MenuItem, 'id'>) =>
    request<MenuItem>(`/menu/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  getOrders: (scope: 'active') => request<Order[]>(`/orders?scope=${scope}`),
  getScheduledOrders: () => request<Order[]>('/orders?scope=scheduled'),
  getOrderHistory: (page: number) => request<OrderHistoryPage>(`/orders?scope=history&page=${page}`),
  getOrder: (id: number) => request<Order>(`/orders/${id}`),
  createOrder: (payload: {
    cart: Cart;
    orderType: 'dinein' | 'takeout';
    table: number | null;
    customerName: string;
    customerPhone: string;
    pickupDate: string | null;
    pickupTime: string | null;
    note: string;
  }) =>
    request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify({ items: cartToItems(payload.cart), ...payload }),
    }),
  createPosOrder: (payload: {
    cart: Cart;
    orderType: 'dinein' | 'takeout';
    table: number | null;
    channel: OrderChannel | null;
    pickupDate: string | null;
    pickupTime: string | null;
    note: string;
  }) =>
    request<Order>('/orders/pos', {
      method: 'POST',
      body: JSON.stringify({ items: cartToItems(payload.cart), ...payload }),
    }),
  advanceOrder: (id: number) => request<Order>(`/orders/${id}/advance`, { method: 'PATCH' }),
  clearOrder: (id: number) => request<Order>(`/orders/${id}/clear`, { method: 'PATCH' }),
  clearTable: (tableNum: number) => request<Order[]>(`/orders/table/${tableNum}/clear`, { method: 'PATCH' }),
  updateOrderPaid: (id: number, paid: boolean) => request<Order>(`/orders/${id}/paid`, { method: 'PATCH', body: JSON.stringify({ paid }) }),
  deleteOrder: (id: number) => request<{ ok: true }>(`/orders/${id}`, { method: 'DELETE' }),

  getMe: () => request<{ authenticated: boolean; permissions: Permission[] }>('/auth/me'),
  login: (username: string, password: string) =>
    request<{ ok: true; permissions: Permission[] }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),

  getUsers: () => request<StaffUser[]>('/users'),
  createUser: (payload: { username: string; password: string; permissions: Permission[] }) =>
    request<StaffUser>('/users', { method: 'POST', body: JSON.stringify(payload) }),
  updateUser: (id: number, payload: { password?: string; permissions?: Permission[] }) =>
    request<StaffUser>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteUser: (id: number) => request<{ ok: true }>(`/users/${id}`, { method: 'DELETE' }),

  getStatsSummary: (range: StatsRange, itemCategory?: string) =>
    request<StatsSummary>(`/stats/summary?range=${range}${itemCategory ? `&itemCategory=${itemCategory}` : ''}`),
  getStatsSummaryCustom: (start: string, end: string, itemCategory?: string) =>
    request<StatsSummary>(`/stats/summary?range=custom&start=${start}&end=${end}${itemCategory ? `&itemCategory=${itemCategory}` : ''}`),
};
