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
          items: cart.map((l) => ({ product_id: l.product_id, quantity: l.quantity })),
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
      <h1 className="text-2xl font-bold mb-5">Checkout</h1>

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
                <li key={l.product_id} className="flex justify-between">
                  <span>{l.quantity}× {l.name}</span>
                  <span className="text-[#1f3d2b]/70">{formatCurrency(l.price_cents * l.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-[#1f3d2b]/10 pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-[#1f3d2b]/60">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              {discountCents > 0 && (
                <div className="flex justify-between text-[#3f7d4f]">
                  <span className="inline-flex items-center