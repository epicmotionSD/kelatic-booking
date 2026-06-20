'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Leaf } from 'lucide-react';
import { clearCart } from '@/lib/commerce/cart';
import { LoyaltyWidget } from '@/components/loyalty/LoyaltyWidget';

function SuccessInner() {
  const params = useSearchParams();
  const orderId = params.get('order');
  const redirectStatus = params.get('redirect_status');
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    // Stripe redirects here after a successful (or processing) payment.
    if (redirectStatus !== 'failed') {
      clearCart();
      setCleared(true);
    }
  }, [redirectStatus]);

  const failed = redirectStatus === 'failed';

  return (
    <div className="min-h-screen bg-[#f7f4ec] text-[#1f3d2b] flex items-center justify-center px-5 py-8">
      <div className="max-w-md w-full space-y-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
        {failed ? (
          <>
            <h1 className="text-2xl font-playfair font-medium mb-2">Payment didn&apos;t go through</h1>
            <p className="text-[#1f3d2b]/60 mb-6">No charge was made. Please try again.</p>
            <Link href="/checkout" className="inline-block bg-[#3f7d4f] text-white px-5 py-2.5 rounded-xl font-semibold">
              Back to checkout
            </Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-[#eef4ec] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9 text-[#3f7d4f]" />
            </div>
            <h1 className="text-2xl font-playfair font-medium mb-1">Thank you!</h1>
            <p className="text-[#1f3d2b]/70 mb-1">Your order is confirmed.</p>
            {orderId && (
              <p className="text-xs text-[#1f3d2b]/40 mb-6">Order #{orderId.slice(0, 8)}</p>
            )}
            <p className="text-sm text-[#1f3d2b]/60 mb-6">
              We&apos;ll have it ready for pickup. A confirmation has been sent to your email.
            </p>
            <Link href="/shop" className="inline-flex items-center gap-2 bg-[#3f7d4f] text-white px-5 py-2.5 rounded-xl font-semibold">
              <Leaf className="w-4 h-4" /> Order more
            </Link>
          </>
        )}
      </div>
      {!failed && orderId && (
        <LoyaltyWidget orderId={orderId} variant="light" />
      )}
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f4ec]" />}>
      <SuccessInner />
    </Suspense>
  );
}
