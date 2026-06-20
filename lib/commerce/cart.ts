// Lightweight client-side cart persisted in localStorage.
// Used by the public storefront + checkout.

export interface CartLine {
  product_id: string;
  name: string;
  price_cents: number;
  quantity: number;
}

const KEY = 'vh_cart_v1';

export function readCart(): CartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event('vh-cart-change'));
}

export function clearCart(): void {
  writeCart([]);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + l.quantity, 0);
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((s, l) => s + l.price_cents * l.quantity, 0);
}
