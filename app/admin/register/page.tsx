'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatCurrency } from '@/lib/currency';
import { CreditCard, Banknote, Plus, Minus, Trash2, Loader2, CheckCircle2, X } from 'lucide-react';
import type { Product, ProductCategory } from '@/types/commerce';

interface CartItem { product: Product; quantity: number }

export default function RegisterPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [activeCat, setActiveCat] = useState<string>('all');
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [tip, setTip] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<null | 'cash' | 'card'>(null);
  const [status, setStatus] = useState<string>('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [p, c] = await Promise.all([
          fetch('/api/admin/products'),
          fetch('/api/admin/products/categories'),
        ]);
        const pData = await p.json();
        const cData = await c.json();
        setProducts((pData.products || []).filter((x: Product) => x.is_active));
        setCategories(cData.categories || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cartLines = Object.values(cart);
  const subtotal = useMemo(
    () => cartLines.reduce((s, l) => s + l.product.price_cents * l.quantity, 0),
    [cartLines]
  );
  const tipCents = Math.max(0, Math.round((parseFloat(tip || '0') || 0) * 100));
  const total = subtotal + tipCents;

  function add(p: Product) {
    setDone(false);
    setCart((c) => {
      const ex = c[p.id];
      return { ...c, [p.id]: { product: p, quantity: (ex?.quantity || 0) + 1 } };
    });
  }
  function dec(id: string) {
    setCart((c) => {
      const ex = c[id];
      if (!ex) return c;
      if (ex.quantity <= 1) {
        const { [id]: _, ...rest } = c;
        return rest;
      }
      return { ...c, [id]: { ...ex, quantity: ex.quantity - 1 } };
    });
  }
  function removeLine(id: string) {
    setCart((c) => {
      const { [id]: _, ...rest } = c;
      return rest;
    });
  }
  function clear() {
    setCart({});
    setTip('');
  }

  async function charge(method: 'cash' | 'card_terminal') {
    if (cartLines.length === 0) return;
    setProcessing(method === 'cash' ? 'cash' : 'card');
    setStatus(method === 'cash' ? 'Recording sale…' : 'Sending to card reader…');
    setDone(false);
    try {
      const res = await fetch('/api/admin/pos/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartLines.map((l) => ({ product_id: l.product.id, quantity: l.quantity })),
          method,
          tip_cents: tipCents,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || 'Payment failed');
        setProcessing(null);
        return;
      }
      if (method === 'cash' || data.paid) {
        finish();
        return;
      }
      // Poll terminal payment status
      const pi = data.paymentIntentId;
      setStatus('Waiting for customer to tap/insert card…');
      const started = Date.now();
      const poll = setInterval(async () => {
        if (Date.now() - started > 120000) {
          clearInterval(poll);
          setStatus('Timed out. Check the reader.');
          setProcessing(null);
          return;
        }
        const sRes = await fetch(`/api/pos/payment-status?id=${pi}`);
        const s = await sRes.json();
        if (s.status === 'succeeded') {
          clearInterval(poll);
          finish();
        } else if (s.status === 'canceled' || s.status === 'requires_payment_method') {
          clearInterval(poll);
          setStatus('Card declined or cancelled.');
          setProcessing(null);
        }
      }, 2500);
    } catch (e) {
      console.error(e);
      setStatus('Something went wrong.');
      setProcessing(null);
    }
  }

  function finish() {
    setProcessing(null);
    setStatus('');
    setDone(true);
    clear();
    setTimeout(() => setDone(false), 3500);
  }

  const visible = activeCat === 'all' ? products : products.filter((p) => p.category_id === activeCat);

  return (
    <div className="">
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Catalog */}
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#00ffb2]" /> Register
          </h1>
          <p className="text-sm text-muted-foreground mb-4">Tap items to build an order.</p>

          <div className="flex flex-wrap gap-2 mb-4">
            <Chip on={activeCat === 'all'} onClick={() => setActiveCat('all')}>
              All
            </Chip>
            {categories.map((c) => (
              <Chip key={c.id} on={activeCat === c.id} onClick={() => setActiveCat(c.id)}>
                {c.name}
              </Chip>
            ))}
          </div>

          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : visible.length === 0 ? (
            <p className="text-muted-foreground text-sm">No active products. Add some under Products.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {visible.map((p) => (
                <button
                  key={p.id}
                  onClick={() => add(p)}
                  className="text-left bg-card border border-border hover:border-[#00ffb2]/40 rounded-xl p-3 transition-colors"
                >
                  <div className="font-medium text-foreground text-sm leading-tight">{p.name}</div>
                  <div className="text-[#00ffb2] font-semibold mt-1">{formatCurrency(p.price_cents)}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="bg-card border border-border rounded-2xl p-4 h-fit lg:sticky lg:top-4">
          <h2 className="font-semibold text-foreground mb-3">Current Order</h2>

          {cartLines.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Cart is empty</p>
          ) : (
            <div className="space-y-2 mb-3">
              {cartLines.map((l) => (
                <div key={l.product.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate">{l.product.name}</div>
                    <div className="text-xs text-muted-foreground">{formatCurrency(l.product.price_cents)}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => dec(l.product.id)} className="p-1 text-muted-foreground hover:text-foreground">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center text-sm">{l.quantity}</span>
                    <button onClick={() => add(l.product)} className="p-1 text-muted-foreground hover:text-foreground">
                      <Plus className="w-4 h-4" />
                    </button>
                    <button onClick={() => removeLine(l.product.id)} className="p-1 text-muted-foreground/60 hover:text-[#ef4444]">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-border pt-3 space-y-1 text-sm">
            <Row label="Subtotal" value={formatCurrency(subtotal)} />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tip</span>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-xs">$</span>
                <input
                  value={tip}
                  onChange={(e) => setTip(e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  className="w-16 border border-border bg-background rounded px-2 py-1 text-sm text-right"
                />
              </div>
            </div>
            <Row label="Total" value={formatCurrency(total)} bold />
          </div>

          {status && (
            <div className="mt-3 text-sm text-muted-foreground flex items-center gap-2">
              {processing && <Loader2 className="w-4 h-4 animate-spin" />} {status}
              {processing === 'card' && (
                <button onClick={() => setProcessing(null)} className="ml-auto text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {done && (
            <div className="mt-3 text-sm text-[#00ffb2] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Payment complete
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={() => charge('cash')}
              disabled={cartLines.length === 0 || !!processing}
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 disabled:opacity-40 text-foreground py-2.5 rounded-lg text-sm font-medium"
            >
              <Banknote className="w-4 h-4" /> Cash
            </button>
            <button
              onClick={() => charge('card_terminal')}
              disabled={cartLines.length === 0 || !!processing}
              className="flex items-center justify-center gap-2 bg-[#00ffb2] hover:brightness-95 disabled:opacity-40 text-black py-2.5 rounded-lg text-sm font-medium"
            >
              <CreditCard className="w-4 h-4" /> Card
            </button>
          </div>
          {cartLines.length > 0 && !processing && (
            <button onClick={clear} className="w-full text-xs text-muted-foreground mt-2 hover:text-foreground">
              Clear order
            </button>
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
      className={`px-3 py-1.5 rounded-full text-sm ${on ? 'bg-[#00ffb2] text-black' : 'bg-card border border-border text-foreground/90'}`}
    >
      {children}
    </button>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? 'font-semibold text-foreground' : 'text-muted-foreground'}>{label}</span>
      <span className={bold ? 'font-bold text-foreground' : 'text-foreground/90'}>{value}</span>
    </div>
  );
}
