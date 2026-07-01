// Lightweight client-side cart persisted in localStorage.
// Used by the public storefront + checkout.

export interface CartLine {
  key: string;              // unique per product + selected-option combo
  product_id: string;
  name: string;
  price_cents: number;      // unit price incl. selected options (server re-verifies)
  quantity: number;
  option_ids?: string[];    // selected product_option ids
  options_label?: string;   // e.g. "32 oz · Sea Moss"
}

// Stable key for a product + a set of chosen option ids.
export function lineKey(productId: string, optionIds: string[] = []): string {
  return optionIds.length ? `${productId}::${[...optionIds].sort().join(',')}` : productId;
}

const KEY = 'vh_cart_v2';

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
