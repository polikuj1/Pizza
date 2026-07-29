import { reactive } from 'vue';
import type { Cart } from '../types';

export const cartState = reactive({
  cart: {} as Cart,
  cartOpen: false,
});

// hasTemp items get one cart entry per temp so 冰/熱 can be ordered in the same checkout independently
export function cartKey(itemId: string, temp: 'ice' | 'hot' | null = null): string {
  return temp ? `${itemId}:${temp}` : itemId;
}

export function addToCart(cart: Cart, itemId: string, temp: 'ice' | 'hot' | null = null) {
  const key = cartKey(itemId, temp);
  const prev = cart[key];
  cart[key] = { itemId, cheese: prev?.cheese ?? false, temp: temp ?? 'ice', qty: (prev?.qty ?? 0) + 1 };
}

export function adjustQty(cart: Cart, key: string, delta: number) {
  const line = cart[key];
  if (!line) return;
  const qty = line.qty + delta;
  if (qty <= 0) delete cart[key];
  else cart[key] = { ...line, qty };
}

export function removeFromCart(cart: Cart, key: string) {
  delete cart[key];
}

export function toggleCheese(cart: Cart, itemId: string) {
  const line = cart[itemId];
  if (line) cart[itemId] = { ...line, cheese: !line.cheese };
  else cart[itemId] = { itemId, qty: 0, cheese: true, temp: 'ice' };
}

export function cartCount(cart: Cart): number {
  return Object.values(cart).reduce((n, l) => n + l.qty, 0);
}
