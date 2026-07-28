import { reactive } from 'vue';
import type { Cart } from '../types';

export const cartState = reactive({
  cart: {} as Cart,
  cartOpen: false,
});

export function addToCart(cart: Cart, id: string) {
  const prev = cart[id] ?? { cheese: false, temp: 'ice' as const, qty: 0 };
  cart[id] = { ...prev, qty: prev.qty + 1 };
}

export function adjustQty(cart: Cart, id: string, delta: number) {
  const line = cart[id];
  if (!line) return;
  const qty = line.qty + delta;
  if (qty <= 0) delete cart[id];
  else cart[id] = { ...line, qty };
}

export function toggleCheese(cart: Cart, id: string) {
  const line = cart[id];
  if (line) cart[id] = { ...line, cheese: !line.cheese };
  else cart[id] = { qty: 0, cheese: true, temp: 'ice' };
}

export function setTemp(cart: Cart, id: string, temp: 'ice' | 'hot') {
  const line = cart[id];
  cart[id] = line ? { ...line, temp } : { qty: 0, cheese: false, temp };
}

export function cartCount(cart: Cart): number {
  return Object.values(cart).reduce((n, l) => n + l.qty, 0);
}
