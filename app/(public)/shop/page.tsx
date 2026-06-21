'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/currency';
import { ShoppingBag, Plus, Minus, Leaf } from 'lucide-react';
import {
  readCart,
  writeCart,
  cartSubtotal,
  cartCount,
  type CartLine,
} from '@/lib/commerce/cart';

interface ShopProduct {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  tags: string[];
  category_id: string | null;
  is_featured: boolean;
}
interface ShopCategory { id: string; name: string }

export default function ShopPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [biz, setBiz] = useState<{ name: string; tagline: string | null }>({ name: 'Shop', tagline: null });
  const [cart, setCart] = useState<CartLine[]>([]);
  const [activeCat, setActiveCat] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCart(readCart());
    (async () => {
      try {
        const res = await fetch('/api/shop/products');
        const data = await res.json();
        setProducts(data.products || []);
        setCategories(data.categories || []);
        if (data.business) setBiz(data.business);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function qtyOf(id: string) {
    return cart.find((l) => l.product_id === id)?.quantity || 0;
  }
  function update(p: ShopProduct, delta: number) {
    setCart((prev) => {
      const ex = prev.find((l) => l.product_id === p.id);
      let next: CartLine[];
      if (ex) {
        const q = ex.quantity + delta;
        next = q <= 0
          ? prev.filter((l) => l.product_id !== p.id)
          : prev.map((l) => (l.product_id === p.id ? { ...l, quantity: q } : l));
      } else if (delta > 0) {
        next = [...prev, { product_id: p.id, name: p.name, price_cents: p.price_cents, quantity: 1 }];
      } else {
        next = prev;
      }
      writeCart(next);
      return next;
    });
  }

  const subtotal = useMemo(() => cartSubtotal(cart), [cart]);
  const count = cartCount(cart);
  const visible = activeCat === 'all' ? products : products.filter((p) => p.category_id === activeCat);

  return (
    <div className="min-h-screen bg-[#f7f4ec] text-[#1f3d2b]">
      {/* Header */}
      <header className="bg-[#3f7d4f] text-white">
        <div className="max-w-5xl mx-auto px-5 py-8">
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <Leaf className="w-4 h-4" /> {biz.name}
          </div>
          <h1 className="text-3xl font-playfair font-medium mt-1">Order Online</h1>
          {biz.tagline && <p className="text-white/80 mt-1">{biz.tagline}</p>}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 py-6 grid lg:grid-cols-3 gap-6">
        {/* Menu */}
        <div className="lg:col-span-2">
          <div className="flex flex-wrap gap-2 mb-5">
            <Chip on={activeCat === 'all'} onClick={() => setActiveCat('all')}>All</Chip>
            {categories.map((c) => (
              <Chip key={c.id} on={activeCat === c.id} onClick={() => setActiveCat(c.id)}>
                {c.name}
              </Chip>
            ))}
          </div>

          {loading ? (
            <p className="text-[#1f3d2b]/50">Loading menu…</p>
          ) : visible.length === 0 ? (
            <p className="text-[#1f3d2b]/50">No items available yet. Check back soon.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {visible.map((p) => {
                const q = qtyOf(p.id);
                return (
                  <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm flex flex-col">
                    <div className="flex-1">
                      <div className="font-semibold">{p.name}</div>
                      {p.description && (
                        <p className="text-sm text-[#1f3d2b]/60 mt-1 line-clamp-2">{p.description}</p>
                      )}
                      {p.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {p.tags.map((t) => (
                            <span key={t} className="text-[10px] uppercase tracking-wide bg-[#eef4ec] text-[#3f7d4f] px-2 py-0.5 rounded-full">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold">{formatCurrency(p.price_cents)}</span>
                      {q === 0 ? (
                        <button
                          onClick={() => update(p, 1)}
                          className="flex items-center gap-1 bg-[#3f7d4f] hover:bg-[#356b44] text-white text-sm px-3 py-1.5 rounded-full"
                        >
                          <Plus className="w-4 h-4" /> Add
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button onClick={() => update(p, -1)} className="p-1.5 bg-[#eef4ec] rounded-full">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-5 text-center font-semibold">{q}</span>
                          <button onClick={() => update(p, 1)} className="p-1.5 bg-[#eef4ec] rounded-full">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm h-fit lg:sticky lg:top-4">
          <h2 className="font-semibold flex items-center gap-2 mb-3">
            <ShoppingBag className="w-5 h-5 text-[#3f7d4f]" /> Your Order
          </h2>
          {cart.length === 0 ? (
            <p className="text-[#1f3d2b]/50 text-sm py-6 text-center">Add items to get started.</p>
          ) : (
            <>
              <ul className="space-y-2 mb-3">
                {cart.map((l) => (
                  <li key={l.product_id} className="flex justify-between text-sm">
                    <span>{l.quantity}× {l.name}</span>
                    <span className="text-[#1f3d2b]/70">{formatCurrency(l.price_cents * l.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-[#1f3d2b]/10 pt-3 flex justify-between font-semibold mb-4">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <button
                onClick={() => router.push('/checkout')}
                className="w-full bg-[#3f7d4f] hover:bg-[#356b44] text-white py-3 rounded-xl font-semibold"
              >
                Checkout · {count} {count === 1 ? 'item' : 'items'}
              </button>
              <p className="text-xs text-[#1f3d2b]/50 text-center mt-2">Pickup only</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm ${on ? 'bg-[#3f7d4f] text-white' : 'bg-white text-[#1f3d2b]/70'}`}
    >
      {children}
    </button>
  );
}
