'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { formatCurrency } from '@/lib/stripe';
import type { BookingData } from '@/app/(public)/book/page';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface PaymentStepProps {
  bookingData: BookingData;
  onComplete: () => void;
  onBack: () => void;
}

export function PaymentStep({ bookingData, onComplete, onBack }: PaymentStepProps) {
  if (!bookingData.paymentIntentClientSecret) {
    // No payment required, shouldn't reach here but handle gracefully
    onComplete();
    return null;
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Secure Your Appointment</h2>
      <p className="text-gray-500 mb-6">
        Pay your {formatCurrency((bookingData.service?.deposit_amount || 0) * 100)} deposit to confirm
      </p>

      <Elements
        stripe={stripePromise}
        options={{
          clientSecret: bookingData.paymentIntentClientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#9333ea',
              borderRadius: '8px',
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
      <div className="bg-purple-50 rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium text-gray-900">{bookingData.service?.name}</p>
            <p className="text-sm text-gray-600">Deposit to secure appointment</p>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(depositAmount * 100)}
          </p>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Security Note */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              Processing...
            </>
          ) : (
            `Pay ${formatCurrency(depositAmount * 100)}`
          )}
        </button>
      </div>

      {/* Cancellation Reminder */}
      <p className="text-xs text-gray-500 text-center mt-4">
        Deposits are non-refundable. You can reschedule with 24+ hours notice.
      </p>
    </form>
  );
}
