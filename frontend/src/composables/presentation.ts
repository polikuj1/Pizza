import { catalog, menuItemById } from '../store/catalog';
import type { Cart, Order, OrderLine } from '../types';

export const STATUS_LABELS = ['已接單', '製作中', '餐點已出', '已完成'];
export const STATUS_COLORS = ['#ffdf3c', '#4fb8e8', '#4fb8e8', '#8fd99f'];
export const TABLES = [1, 2, 3, 4, 5];

export function timeLabel(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Taipei' });
}

export function dateTimeLabel(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Taipei',
  });
}

export const ORDER_TYPE_COLORS: Record<Order['orderType'], string> = {
  dinein: '#e8384f',
  takeout: '#3fae66',
  online: '#4fb8e8',
};

export const ORDER_TYPE_LABELS: Record<Order['orderType'], string> = {
  dinein: '內用',
  takeout: '現場外帶',
  online: '線上外帶',
};

export function orderTypeLabel(o: Order): string {
  if (o.orderType === 'dinein') return `內用 ${o.table} 桌`;
  return ORDER_TYPE_LABELS[o.orderType];
}

export function orderTypeColor(o: Order): string {
  return ORDER_TYPE_COLORS[o.orderType];
}

export function paymentLabel(o: Order): string {
  return o.payment === 'online' ? '線上付款' : '到店付款';
}

export const CHANNEL_LABELS: Record<string, string> = { walkin: '現場', ig: 'IG', phone: '電話' };

export function channelLabel(o: Order): string {
  return o.channel ? (CHANNEL_LABELS[o.channel] ?? o.channel) : '';
}

// pickupDate 沒填代表「今天／立即」，只顯示時間；有填才連日期一起顯示，避免跟當天的單搞混
export function pickupLabel(o: Order): string {
  if (!o.pickupTime) return '';
  if (!o.pickupDate) return o.pickupTime;
  const [, m, d] = o.pickupDate.split('-');
  return `${m}/${d} ${o.pickupTime}`;
}

// 同一張訂單裡，同品項不同溫度會是不同行（見 store/cart.ts 的 cartKey），這個組合在單一訂單內保證唯一
export function orderLineKey(item: OrderLine): string {
  return `${item.id}:${item.temp}:${item.cheese}`;
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

export function buildCartLine(key: string, cart: Cart) {
  const line = cart[key];
  const item = menuItemById(line.itemId)!;
  const upcharge = cheeseUpcharge();
  const unitPrice = item.price + (line.cheese ? upcharge : 0);
  return {
    id: key,
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
    .filter((key) => cart[key].qty > 0)
    .map((key) => buildCartLine(key, cart));
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
