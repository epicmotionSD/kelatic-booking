'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { formatCurrency } from '@/lib/currency';
import { CreditCard, Banknote, Plus, Minus, Trash2, Loader2, CheckCircle2, X } from 'lucide-react';
import type { Product, ProductCategory } from '@/types/commerce';
import { StatusDot } from '@/components/terminal';

interface CartItem { product: Product; quantity: number }
interface Reader { id?: string; label?: string; status?: string; device_type?: string; serial_number?: string }

export default function RegisterPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [taxRate, setTaxRate] = useState(0);
  const [activeCat, setActiveCat] = useState<string>('all');
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [tip, setTip] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<null | 'cash' | 'card'>(null);
  const [status, setStatus] = useState<string>('');
  const [done, setDone] = useState(false);

  // Stripe Terminal reader (shared smart reader, server-driven)
  const [reader, setReader] = useState<Reader | null>(null);
  const [readerLoading, setReaderLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        if (typeof pData.tax_rate === 'number') setTaxRate(pData.tax_rate);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Poll reader status so the register is clearly linked to the reader
  useEffect(() => {
    let live = true;
    const fetchReader = async () => {
      try {
        const r = await fetch('/api/pos/reader-status');
        const d = await r.json();
        if (live) setReader(d.reader || null);
      } catch {
        /* ignore */
      } finally {
        if (live) setReaderLoading(false);
      }
    };
    fetchReader();
    const id = setInterval(fetchReader, 20000);
    return () => { live = false; clearInterval(id); };
  }, []);

  const readerOnline = reader?.status === 'online';

  const cartLines = Object.values(cart);
  const subtotal = useMemo(
    () => cartLines.reduce((s, l) => s + l.product.price_cents * l.quantity, 0),
    [cartLines]
  );
  const tipCents = Math.max(0, Math.round((parseFloat(tip || '0') || 0) * 100));
  const taxCents = Math.round(subtotal * taxRate);
  const total = subtotal + taxCents + tipCents;

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
  function stopPoll() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  async function charge(method: 'cash' | 'card_terminal') {
    if (cartLines.length === 0) return;
    if (method === 'card_terminal' && !readerOnline) {
      setStatus('Card reader is offline. Connect the reader or take cash.');
      return;
    }
    setProcessing(method === 'cash' ? 'cash' : 'card');
    setStatus(method === 'cash' ? 'Recording sale…' : 'Sending total to the reader…');
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
      // Card pushed to the reader — poll for completion
      const pi = data.paymentIntentId;
      setStatus('Tap, insert, or swipe on the reader…');
      const started = Date.now();
      stopPoll();
      pollRef.current = setInterval(async () => {
        if (Date.now() - started > 120000) {
          stopPoll();
          setStatus('Timed out. Check the reader.');
          setProcessing(null);
          return;
        }
        const sRes = await fetch(`/api/pos/payment-status?id=${pi}`);
        const s = await sRes.json();
        if (s.status === 'succeeded') {
          stopPoll();
          finish();
        } else if (s.status === 'canceled' || s.status === 'requires_payment_method') {
          stopPoll();
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

  async function cancelCard() {
    stopPoll();
    setStatus('Cancelling on the reader…');
    try {
      await fetch('/api/pos/cancel-reader', { method: 'POST' });
    } catch {
      /* ignore */
    }
    setProcessing(null);
    setStatus('Cancelled.');
    setTimeout(() => setStatus(''), 2000);
  }

  function finish() {
    stopPoll();
    setProcessing(null);
    setStatus('');
    setDone(true);
    clear();
    setTimeout(() => setDone(false), 3500);
  }

  const visible = activeCat === 'all' ? products : products.filter((p) => p.category_id === activeCat);

  return (
    <div className="pb-24 lg:pb-0">
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">Current Order</h2>
            <ReaderChip reader={reader} loading={readerLoading} />
          </div>

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
            {taxCents > 0 && (
              <Row label={`Tax${taxRate > 0 ? ` (${(taxRate * 100).toFixed(1)}%)` : ''}`} value={formatCurrency(taxCents)} />
            )}
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
                <button onClick={cancelCard} className="ml-auto text-[#ef4444] hover:brightness-110" title="Cancel on reader">
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
              disabled={cartLines.length === 0 || !!processing || !readerOnline}
              title={!readerOnline ? 'Card reader offline' : undefined}
              className="flex items-center justify-center gap-2 bg-[#00ffb2] hover:brightness-95 disabled:opacity-40 text-black py-2.5 rounded-lg text-sm font-medium"
            >
              <CreditCard className="w-4 h-4" /> Card
            </button>
          </div>
          {!readerLoading && !readerOnline && (
            <p className="text-[11px] text-[#f59e0b] mt-2 text-center">
              Reader offline — card payments unavailable. Cash still works.
            </p>
          )}
          {cartLines.length > 0 && !processing && (
            <button onClick={clear} className="w-full text-xs text-muted-foreground mt-2 hover:text-foreground">
              Clear order
            </button>
          )}
        </div>
      </div>

      {/* Mobile sticky pay bar — charge without scrolling */}
      {cartLines.length > 0 && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-card border-t border-border px-4 py-3 flex items-center gap-3">
          <div className="min-w-0">
            <div className="data-mono text-lg font-bold text-foreground leading-none">{formatCurrency(total)}</div>
            <div className="text-[11px] text-muted-foreground">{cartLines.reduce((n, l) => n + l.quantity, 0)} items</div>
          </div>
          <div className="flex-1" />
          <button
            onClick={() => charge('cash')}
            disabled={!!processing}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 disabled:opacity-40 text-foreground px-4 py-2.5 rounded-lg text-sm font-medium"
          >
            <Banknote className="w-4 h-4" /> Cash
          </button>
          <button
            onClick={() => charge('card_terminal')}
            disabled={!!processing || !readerOnline}
            title={!readerOnline ? 'Card reader offline' : undefined}
            className="flex items-center gap-1.5 bg-[#00ffb2] hover:brightness-95 disabled:opacity-40 text-black px-4 py-2.5 rounded-lg text-sm font-medium"
          >
            <CreditCard className="w-4 h-4" /> Card
          </button>
        </div>
      )}
    </div>
  );
}

function ReaderChip({ reader, loading }: { reader: Reader | null; loading: boolean }) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 term-label text-muted-foreground">
        <StatusDot tone="idle" /> reader…
      </span>
    );
  }
  if (!reader) {
    return (
      <span className="inline-flex items-center gap-1.5 term-label text-[#ef4444]">
        <StatusDot tone="down" /> no reader
      </span>
    );
  }
  const online = reader.status === 'online';
  return (
    <span className={`inline-flex items-center gap-1.5 term-label ${online ? 'text-[#00ffb2]' : 'text-[#f59e0b]'}`}>
      <StatusDot tone={online ? 'up' : 'warn'} /> {reader.label || 'reader'}{online ? '' : ' · offline'}
    </span>
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
