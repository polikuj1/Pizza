import { catalog, menuItemById } from '../store/catalog';
import type { Cart, Order } from '../types';

export const STATUS_LABELS = ['已接單', '製作中', '餐點已出', '已完成'];
export const STATUS_COLORS = ['#ffdf3c', '#4fb8e8', '#4fb8e8', '#8fd99f'];
export const TABLES = [1, 2, 3, 4, 5, 6, 7, 8];

export function timeLabel(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
}

export function orderTypeLabel(o: Order): string {
  if (o.orderType === 'dinein') return `內用 ${o.table} 桌`;
  if (o.orderType === 'takeout') return '現場外帶';
  return '線上外帶';
}

export function orderTypeColor(o: Order): string {
  if (o.orderType === 'dinein') return '#e8384f';
  if (o.orderType === 'takeout') return '#3fae66';
  return '#4fb8e8';
}

export function paymentLabel(o: Order): string {
  return o.payment === 'online' ? '線上付款' : '到店付款';
}

export function itemsSummary(o: Order): string {
  return o.items.map((l) => `${l.zh}${l.tempSuffix}${l.cheeseSuffix} × ${l.qty}`).join('、');
}

// dine-in orders stop advancing through the queue at "餐點已出" (index 2); the table is then cleared instead
export function advanceCap(o: Order): number {
  return o.orderType === 'dinein' ? 2 : STATUS_LABELS.length - 1;
}

export function cheeseUpcharge(): number {
  return catalog.config?.cheeseUpcharge ?? 50;
}

export function buildCartLine(id: string, cart: Cart) {
  const item = menuItemById(id)!;
  const line = cart[id];
  const upcharge = cheeseUpcharge();
  const unitPrice = item.price + (line.cheese ? upcharge : 0);
  return {
    id,
    zh: item.zh,
    qty: line.qty,
    cheeseLabel: line.cheese ? `加起司 +${upcharge}` : '原味',
    cheeseSuffix: line.cheese ? '（+起司）' : '',
    tempSuffix: item.hasTemp ? `（${line.temp === 'hot' ? '熱' : '冰'}）` : '',
    lineTotal: unitPrice * line.qty,
  };
}

export function cartLines(cart: Cart) {
  return Object.keys(cart)
    .filter((id) => cart[id].qty > 0)
    .map((id) => buildCartLine(id, cart));
}

export function cartTotal(cart: Cart): number {
  return cartLines(cart).reduce((n, l) => n + l.lineTotal, 0);
}

export function statusSteps(statusIdx: number) {
  return STATUS_LABELS.map((label, i) => ({
    label,
    mark: i < statusIdx ? '✓' : String(i + 1),
    dotColor: i <= statusIdx ? '#e8384f' : '#fff',
    labelColor: i <= statusIdx ? '#1a1a1a' : 'rgba(26,26,29,.4)',
  }));
}
