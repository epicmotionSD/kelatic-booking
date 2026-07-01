'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/currency';
import { ShoppingBag, Plus, Minus, Leaf, X } from 'lucide-react';
import {
  readCart,
  writeCart,
  cartSubtotal,
  cartCount,
  lineKey,
  type CartLine,
} from '@/lib/commerce/cart';

interface ShopOption {
  id: string;
  name: string;
  price_delta_cents: number;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
}
interface ShopOptionGroup {
  id: string;
  name: string;
  min_select: number;
  max_select: number;
  sort_order: number;
  options: ShopOption[];
}
interface ShopProduct {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  tags: string[];
  category_id: string | null;
  is_featured: boolean;
  image_url: string | null;
  option_groups?: ShopOptionGroup[];
}
interface ShopCategory { id: string; name: string }

function activeGroups(p: ShopProduct): ShopOptionGroup[] {
  return (p.option_groups || [])
    .map((g) => ({ ...g, options: (g.options || []).filter((o) => o.is_active).sort((a, b) => a.sort_order - b.sort_order) }))
    .filter((g) => g.options.length > 0)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export default function ShopPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [biz, setBiz] = useState<{ name: string; tagline: string | null }>({ name: 'Shop', tagline: null });
  const [cart, setCart] = useState<CartLine[]>([]);
  const [activeCat, setActiveCat] = useState('all');
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState<ShopProduct | null>(null);

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

  function qtyOf(key: string) {
    return cart.find((l) => l.key === key)?.quantity || 0;
  }

  function addLine(line: Omit<CartLine, 'quantity'>, qty = 1) {
    setCart((prev) => {
      const ex = prev.find((l) => l.key === line.key);
      const next = ex
        ? prev.map((l) => (l.key === line.key ? { ...l, quantity: l.quantity + qty } : l))
        : [...prev, { ...line, quantity: qty }];
      writeCart(next);
      return next;
    });
  }

  function changeQty(key: string, delta: number) {
    setCart((prev) => {
      const ex = prev.find((l) => l.key === key);
      if (!ex) return prev;
      const q = ex.quantity + delta;
      const next = q <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, quantity: q } : l));
      writeCart(next);
      return next;
    });
  }

  // Simple products (no options) add directly; product cards use a per-product stepper.
  function addSimple(p: ShopProduct, delta: number) {
    if (delta > 0) addLine({ key: p.id, product_id: p.id, name: p.name, price_cents: p.price_cents });
    else changeQty(p.id, -1);
  }

  const subtotal = useMemo(() => cartSubtotal(cart), [cart]);
  const count = cartCount(cart);
  const visible = activeCat === 'all' ? products : products.filter((p) => p.category_id === activeCat);

  return (
    <div className="min-h-screen bg-[#f7f4ec] text-[#1f3d2b]">
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
                const groups = activeGroups(p);
                const hasOptions = groups.length > 0;
                const q = qtyOf(p.id);
                return (
                  <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm flex flex-col">
                    {p.image_url && (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        loading="lazy"
                        className="w-full aspect-[4/3] object-cover rounded-xl mb-3 bg-[#eef4ec]"
                      />
                    )}
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
                      <span className="font-bold">
                        {hasOptions && <span className="text-xs font-normal text-[#1f3d2b]/50 mr-1">from</span>}
                        {formatCurrency(p.price_cents)}
                      </span>
                      {hasOptions ? (
                        <button
                          onClick={() => setPicker(p)}
                          className="flex items-center gap-1 bg-[#3f7d4f] hover:bg-[#356b44] text-white text-sm px-3 py-1.5 rounded-full"
                        >
                          <Plus className="w-4 h-4" /> Choose
                        </button>
                      ) : q === 0 ? (
                        <button
                          onClick={() => addSimple(p, 1)}
                          className="flex items-center gap-1 bg-[#3f7d4f] hover:bg-[#356b44] text-white text-sm px-3 py-1.5 rounded-full"
                        >
                          <Plus className="w-4 h-4" /> Add
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button onClick={() => addSimple(p, -1)} className="p-1.5 bg-[#eef4ec] rounded-full">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-5 text-center font-semibold">{q}</span>
                          <button onClick={() => addSimple(p, 1)} className="p-1.5 bg-[#eef4ec] rounded-full">
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
              <ul className="space-y-3 mb-3">
                {cart.map((l) => (
                  <li key={l.key} className="flex justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <div>{l.quantity}× {l.name}</div>
                      {l.options_label && <div className="text-xs text-[#1f3d2b]/50">{l.options_label}</div>}
                      <button onClick={() => changeQty(l.key, -1)} className="text-xs text-[#3f7d4f] hover:underline mt-0.5">
                        Remove one
                      </button>
                    </div>
                    <span className="text-[#1f3d2b]/70 shrink-0">{formatCurrency(l.price_cents * l.quantity)}</span>
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

      {picker && (
        <OptionPicker
          product={picker}
          groups={activeGroups(picker)}
          onClose={() => setPicker(null)}
          onAdd={(line) => {
            addLine(line);
            setPicker(null);
          }}
        />
      )}
    </div>
  );
}

function OptionPicker({
  product,
  groups,
  onClose,
  onAdd,
}: {
  product: ShopProduct;
  groups: ShopOptionGroup[];
  onClose: () => void;
  onAdd: (line: Omit<CartLine, 'quantity'>) => void;
}) {
  // Initialize: single-select required groups default to their default option (or first).
  const [selected, setSelected] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    for (const g of groups) {
      if (g.max_select === 1 && g.min_select >= 1) {
        const def = g.options.find((o) => o.is_default) || g.options[0];
        init[g.id] = def ? [def.id] : [];
      } else {
        init[g.id] = g.options.filter((o) => o.is_default).map((o) => o.id);
      }
    }
    return init;
  });

  function toggle(group: ShopOptionGroup, optId: string) {
    setSelected((prev) => {
      const cur = prev[group.id] || [];
      if (group.max_select === 1) return { ...prev, [group.id]: [optId] };
      const has = cur.includes(optId);
      if (has) return { ...prev, [group.id]: cur.filter((x) => x !== optId) };
      if (cur.length >= group.max_select) return prev;
      return { ...prev, [group.id]: [...cur, optId] };
    });
  }

  const allOptionIds = groups.flatMap((g) => selected[g.id] || []);
  const optionsById = new Map(groups.flatMap((g) => g.options.map((o) => [o.id, { ...o, group: g.name }])));
  const deltas = allOptionIds.reduce((s, id) => s + (optionsById.get(id)?.price_delta_cents || 0), 0);
  const unitPrice = product.price_cents + deltas;
  const label = allOptionIds
    .map((id) => optionsById.get(id)?.name)
    .filter(Boolean)
    .join(' · ');

  // Required single-select groups must have a selection.
  const missing = groups.some((g) => g.min_select >= 1 && (selected[g.id]?.length || 0) < g.min_select);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#1f3d2b]/10 sticky top-0 bg-white">
          <h2 className="font-playfair text-xl font-medium">{product.name}</h2>
          <button onClick={onClose} className="text-[#1f3d2b]/50 hover:text-[#1f3d2b]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {groups.map((g) => (
            <div key={g.id}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">{g.name}</span>
                <span className="text-xs text-[#1f3d2b]/50">
                  {g.min_select >= 1 ? 'Required' : g.max_select > 1 ? `Choose up to ${g.max_select}` : 'Optional'}
                </span>
              </div>
              <div className="space-y-1.5">
                {g.options.map((o) => {
                  const on = (selected[g.id] || []).includes(o.id);
                  return (
                    <button
                      key={o.id}
                      onClick={() => toggle(g, o.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                        on ? 'border-[#3f7d4f] bg-[#eef4ec]' : 'border-[#1f3d2b]/10 hover:border-[#3f7d4f]/50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${on ? 'border-[#3f7d4f] bg-[#3f7d4f]' : 'border-[#1f3d2b]/30'}`}>
                          {on && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        {o.name}
                      </span>
                      {o.price_delta_cents > 0 && (
                        <span className="text-[#1f3d2b]/60">+{formatCurrency(o.price_delta_cents)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 border-t border-[#1f3d2b]/10 sticky bottom-0 bg-white">
          <button
            disabled={missing}
            onClick={() =>
              onAdd({
                key: lineKey(product.id, allOptionIds),
                product_id: product.id,
                name: product.name,
                price_cents: unitPrice,
                option_ids: allOptionIds,
                options_label: label || undefined,
              })
            }
            className="w-full bg-[#3f7d4f] hover:bg-[#356b44] disabled:opacity-50 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            Add to order · {formatCurrency(unitPrice)}
          </button>
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
