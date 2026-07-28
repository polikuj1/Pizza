import type { AppConfig, Cart, Category, MenuItem, Order } from './types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? '發生錯誤');
  return body as T;
}

function cartToItems(cart: Cart) {
  return Object.entries(cart)
    .filter(([, line]) => line.qty > 0)
    .map(([id, line]) => ({ id, qty: line.qty, cheese: line.cheese, temp: line.temp }));
}

export const api = {
  getConfig: () => request<AppConfig>('/config'),
  getMenu: () => request<{ items: MenuItem[]; categories: Category[] }>('/menu'),
  getOrders: (scope: 'active' | 'history') => request<Order[]>(`/orders?scope=${scope}`),
  getOrder: (id: number) => request<Order>(`/orders/${id}`),
  createOrder: (payload: {
    cart: Cart;
    customerName: string;
    customerPhone: string;
    note: string;
    payment: 'store' | 'online';
  }) =>
    request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify({ items: cartToItems(payload.cart), ...payload }),
    }),
  createPosOrder: (payload: { cart: Cart; orderType: 'dinein' | 'takeout'; table: number | null; note: string }) =>
    request<Order>('/orders/pos', {
      method: 'POST',
      body: JSON.stringify({ items: cartToItems(payload.cart), ...payload }),
    }),
  advanceOrder: (id: number) => request<Order>(`/orders/${id}/advance`, { method: 'PATCH' }),
  clearOrder: (id: number) => request<Order>(`/orders/${id}/clear`, { method: 'PATCH' }),
};
