'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { formatCurrency } from '@/lib/currency';
import { ArrowLeft, Gem, Loader2 } from 'lucide-react';
import { readCart, cartSubtotal, type CartLine } from '@/lib/commerce/cart';
import type { EligibleReward, RedemptionPreview } from '@/lib/agents/modules/loyalty';

let stripePromise: Promise<any> | null = null;
const getStripe = () => {
  if (typeof window === 'undefined') return null;
  if (!stripePromise && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [tip, setTip] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<RedemptionPreview | null>(null);
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const previewSeq = useRef(0);

  useEffect(() => {
    setCart(readCart());
  }, []);

  const subtotal = useMemo(() => cartSubtotal(cart), [cart]);
  const tipCents = Math.max(0, Math.round((parseFloat(tip || '0') || 0) * 100));
  const selectedReward: EligibleReward | undefined = preview?.eligibleRewards.find(
    (r) => r.id === selectedRewardId
  );
  const discountCents = selectedReward?.discountPreviewCents ?? 0;
  const total = Math.max(0, subtotal - discountCents) + tipCents;

  // Look up the customer's loyalty balance + eligible rewards once we have
  // an email and a subtotal. Debounced so typing doesn't spam the endpoint.
  useEffect(() => {
    const trimmed = email.trim();
    if (!trimmed || subtotal <= 0 || clientSecret) {
      setPreview(null);
      return;
    }
    const seq = ++previewSeq.current;
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/loyalty/redemption-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmed, subtotalCents: subtotal }),
        });
        if (!res.ok || seq !== previewSeq.current) return;
        const data = (await res.json()) as RedemptionPreview;
        if (seq !== previewSeq.current) return;
        setPreview(data);
        // Drop the selection if it's no longer eligible
        if (
          selectedRewardId &&
          !data.eligibleRewards.find((r) => r.id === selectedRewardId)
        ) {
          setSelectedRewardId(null);
        }
      } catch {
        // best-effort
      }
    }, 400);
    return () => clearTimeout(t);
  }, [email, subtotal, clientSecret, selectedRewardId]);

  async function startPayment() {
    setError(null);
    if (!name.trim() || !email.trim()) {
      setError('Please enter your name and email.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/shop/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((l) => ({ product_id: l.product_id, quantity: l.quantity, option_ids: l.option_ids || [] })),
          customer: { name: name.trim(), email: email.trim(), phone: phone.trim() },
          tip_cents: tipCents,
          notes: notes.trim() || undefined,
          loyalty: selectedRewardId ? { rewardId: selectedRewardId } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not start checkout.');
        return;
      }
      setOrderId(data.orderId);
      setClientSecret(data.clientSecret);
    } finally {
      setSubmitting(false);
    }
  }

  if (cart.length === 0 && !clientSecret) {
    return (
      <Shell>
        <div className="text-center py-16">
          <p className="text-[#1f3d2b]/60 mb-4">Your cart is empty.</p>
          <Link href="/shop" className="text-[#3f7d4f] font-semibold">← Back to menu</Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-[#1f3d2b]/60 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to menu
      </Link>
      <h1 className="text-2xl font-playfair font-medium mb-5">Checkout</h1>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Form / payment */}
        <div className="lg:col-span-3 space-y-4">
          {!clientSecret ? (
            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
              <Field label="Name *"><input className={inp} value={name} onChange={(e) => setName(e.target.value)} /></Field>
              <Field label="Email *"><input type="email" className={inp} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
              <Field label="Phone"><input className={inp} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>

              {preview?.customerView && preview.eligibleRewards.length > 0 && (
                <RewardsPicker
                  preview={preview}
                  selectedId={selectedRewardId}
                  onSelect={setSelectedRewardId}
                />
              )}

              <Field label="Order notes"><textarea rows={2} className={inp} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies, pickup time, etc." /></Field>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#1f3d2b]/70">Add a tip</span>
                <div className="flex items-center gap-1">
                  <span className="text-[#1f3d2b]/40 text-sm">$</span>
                  <input value={tip} onChange={(e) => setTip(e.target.value)} inputMode="decimal" placeholder="0.00" className="w-20 border border-[#1f3d2b]/15 rounded-lg px-2 py-1 text-sm text-right" />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                onClick={startPayment}
                disabled={submitting}
                className="w-full bg-[#3f7d4f] hover:bg-[#356b44] disabled:opacity-50 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Continue to payment · {formatCurrency(total)}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <Elements
                stripe={getStripe()}
                options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#3f7d4f' } } }}
              >
                <PayForm orderId={orderId!} total={total} />
              </Elements>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-5 shadow-sm h-fit">
            <h2 className="font-semibold mb-3">Order Summary</h2>
            <ul className="space-y-2 mb-3 text-sm">
              {cart.map((l) => (
                <li key={l.key} className="flex justify-between gap-2">
                  <span className="min-w-0">
                    {l.quantity}× {l.name}
                    {l.options_label && <span className="block text-xs text-[#1f3d2b]/50">{l.options_label}</span>}
                  </span>
                  <span className="text-[#1f3d2b]/70 shrink-0">{formatCurrency(l.price_cents * l.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-[#1f3d2b]/10 pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-[#1f3d2b]/60">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              {discountCents > 0 && (
                <div className="flex justify-between text-[#3f7d4f]">
                  <span className="inline-flex items-center gap-1">
                    <Gem className="w-3.5 h-3.5" />
                    {selectedReward?.name ?? 'Reward'}
                  </span>
                  <span>-{formatCurrency(discountCents)}</span>
                </div>
              )}
              {tipCents > 0 && <div className="flex justify-between"><span className="text-[#1f3d2b]/60">Tip</span><span>{formatCurrency(tipCents)}</span></div>}
              <div className="flex justify-between font-bold pt-1"><span>Total</span><span>{formatCurrency(total)}</span></div>
            </div>
            <p className="text-xs text-[#1f3d2b]/50 mt-3">Pickup only · You&apos;ll get a confirmation by email.</p>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function PayForm({ orderId, total }: { orderId: string; total: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);
    const { error: err } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/checkout/success?order=${orderId}` },
    });
    if (err) {
      setError(err.message || 'Payment failed.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full mt-5 bg-[#3f7d4f] hover:bg-[#356b44] disabled:opacity-50 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Pay {formatCurrency(total)}
      </button>
    </form>
  );
}

const inp = 'w-full border border-[#1f3d2b]/15 rounded-lg px-3 py-2 text-sm';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#1f3d2b]/80 mb-1">{label}</label>
      {children}
    </div>
  );
}

function RewardsPicker({
  preview,
  selectedId,
  onSelect,
}: {
  preview: RedemptionPreview;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const view = preview.customerView!;
  return (
    <div className="rounded-xl border border-[#3f7d4f]/30 bg-[#eef4ec] p-3">
      <div className="flex items-center gap-2 mb-2">
        <Gem className="w-4 h-4 text-[#3f7d4f]" />
        <span className="text-sm font-semibold text-[#1f3d2b]">
          {view.balance} {view.currencyLabel}
        </span>
        {view.currentTier && (
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#3f7d4f]/15 text-[#3f7d4f]">
            {view.currentTier}
          </span>
        )}
        <span className="text-xs text-[#1f3d2b]/60 ml-auto">Use a reward?</span>
      </div>
      <div className="space-y-1.5">
        {preview.eligibleRewards.map((r) => {
          const selected = r.id === selectedId;
          const disabled = r.discountPreviewCents <= 0;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelect(selected ? null : r.id)}
              disabled={disabled}
              className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                selected
                  ? 'border-[#3f7d4f] bg-white'
                  : 'border-[#1f3d2b]/10 bg-white hover:border-[#3f7d4f]/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{r.name}</span>
                <span className="text-xs text-[#1f3d2b]/60 data-mono shrink-0">
                  {r.costPoints} {view.currencyLabel}
                </span>
              </div>
              <div className="text-xs text-[#3f7d4f] mt-0.5">
                {r.discountPreviewCents > 0
                  ? `-${formatCurrency(r.discountPreviewCents)} off this order`
                  : r.reason === 'below_min_spend'
                  ? 'Add more to qualify'
                  : r.reason === 'unsupported_at_checkout'
                  ? 'In-store only'
                  : 'Not applicable to this cart'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f4ec] text-[#1f3d2b]">
      <div className="max-w-4xl mx-auto px-5 py-8">{children}</div>
    </div>
  );
}
