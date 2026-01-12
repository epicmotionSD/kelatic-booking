'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { formatCurrency } from '@/lib/currency';
import type { BookingData } from '@/app/(public)/book/page';

// Initialize Stripe only on client side
let stripePromise: Promise<any> | null = null;

const getStripePromise = () => {
  if (typeof window === 'undefined') {
    return null; // Don't initialize on server
  }
  if (!stripePromise && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

interface PaymentStepProps {
  bookingData: BookingData;
  onComplete: () => void;
  onBack: () => void;
}

export function PaymentStep({ bookingData, onComplete, onBack }: PaymentStepProps) {
  // Handle no payment required case with useEffect to avoid infinite re-renders
  useEffect(() => {
    if (!bookingData.paymentIntentClientSecret) {
      // No payment required, shouldn't reach here but handle gracefully
      onComplete();
    }
  }, [bookingData.paymentIntentClientSecret, onComplete]);

  if (!bookingData.paymentIntentClientSecret) {
    return null; // Don't render anything while redirecting
  }

  const currentStripePromise = getStripePromise();

  if (!currentStripePromise) {
    return (
      <div className="text-center py-8">
        <div className="text-red-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-stone-900 mb-2">Payment System Unavailable</h3>
        <p className="text-stone-600 mb-4">
          We're experiencing technical difficulties with our payment system. Please try again later or contact us for assistance.
        </p>
        <button
          onClick={onBack}
          className="bg-white border border-stone-200 text-stone-900 px-4 py-2 rounded-xl hover:bg-stone-50 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-stone-900 mb-2">Secure Your Appointment</h2>
      <p className="text-stone-600 mb-6">
        Pay your {formatCurrency((bookingData.service?.deposit_amount || 0) * 100)} deposit to confirm
      </p>

      <Elements
        stripe={currentStripePromise}
        options={{
          clientSecret: bookingData.paymentIntentClientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#f59e0b',
              colorBackground: '#ffffff',
              colorText: '#1c1917',
              colorTextSecondary: '#78716c',
              colorDanger: '#ef4444',
              fontFamily: 'system-ui, sans-serif',
              borderRadius: '12px',
              spacingUnit: '4px',
            },
            rules: {
              '.Input': {
                backgroundColor: '#ffffff',
                border: '1px solid #d6d3d1',
              },
              '.Input:focus': {
                border: '1px solid #f59e0b',
                boxShadow: '0 0 0 1px #f59e0b',
              },
              '.Tab': {
                backgroundColor: '#ffffff',
                border: '1px solid #d6d3d1',
              },
              '.Tab--selected': {
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
              },
              '.Label': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
            },
          },
        }}
      >
        <PaymentForm
          bookingData={bookingData}
          onComplete={onComplete}
          onBack={onBack}
        />
      </Elements>
    </div>
  );
}

interface PaymentFormProps {
  bookingData: BookingData;
  onComplete: () => void;
  onBack: () => void;
}

function PaymentForm({ bookingData, onComplete, onBack }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/book/confirmation?appointment=${bookingData.appointmentId}`,
      },
      redirect: 'if_required',
    });

    if (submitError) {
      setError(submitError.message || 'Payment failed. Please try again.');
      setLoading(false);
      return;
    }

    // Payment successful
    onComplete();
  }

  const depositAmount = bookingData.service?.deposit_amount || 0;

  return (
    <form onSubmit={handleSubmit}>
      {/* Payment Summary */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium text-stone-900">{bookingData.service?.name}</p>
            <p className="text-sm text-stone-600">Deposit to secure appointment</p>
          </div>
          <p className="text-xl font-bold text-amber-600">
            {formatCurrency(depositAmount * 100)}
          </p>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 mb-6">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Security Note */}
      <div className="flex items-center gap-2 text-sm text-stone-600 mb-6">
        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>Payments are secure and encrypted</span>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 py-3 bg-white border border-stone-200 text-stone-900 rounded-xl font-semibold hover:bg-stone-50 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black" />
              Processing...
            </>
          ) : (
            `Pay ${formatCurrency(depositAmount * 100)}`
          )}
        </button>
      </div>

      {/* Cancellation Reminder */}
      <p className="text-xs text-stone-500 text-center mt-4">
        Deposits are non-refundable. You can reschedule with 24+ hours notice.
      </p>
    </form>
  );
}
