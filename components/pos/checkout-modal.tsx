'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, toCents } from '@/lib/stripe';
import type { AppointmentWithDetails } from '@/types/database';

interface CheckoutModalProps {
  appointment: AppointmentWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type CheckoutStep = 'summary' | 'tip' | 'processing' | 'complete' | 'error';

const TIP_PRESETS = [15, 20, 25, 30];

export function CheckoutModal({
  appointment,
  isOpen,
  onClose,
  onComplete,
}: CheckoutModalProps) {
  const [step, setStep] = useState<CheckoutStep>('summary');
  const [tipPercent, setTipPercent] = useState<number | null>(20);
  const [customTip, setCustomTip] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'terminal' | 'cash'>('terminal');
  const [error, setError] = useState<string | null>(null);
  const [processingMessage, setProcessingMessage] = useState('');

  // Calculate amounts
  const serviceAmount = (appointment.final_price || appointment.quoted_price) * 100; // in cents
  const depositPaid = appointment.payments
    ?.filter((p) => p.is_deposit && p.status === 'paid')
    .reduce((sum, p) => sum + p.amount * 100, 0) || 0;
  const remainingAmount = serviceAmount - depositPaid;
  
  const tipAmount = customTip
    ? toCents(parseFloat(customTip) || 0)
    : tipPercent
    ? Math.round(serviceAmount * (tipPercent / 100))
    : 0;
  
  const totalAmount = remainingAmount + tipAmount;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('summary');
      setTipPercent(20);
      setCustomTip('');
      setError(null);
    }
  }, [isOpen]);

  async function processPayment() {
    setStep('processing');
    setError(null);

    try {
      if (paymentMethod === 'terminal') {
        // Create payment intent for terminal
        setProcessingMessage('Creating payment...');
        const createRes = await fetch('/api/pos/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointmentId: appointment.id,
            amount: remainingAmount,
            tipAmount: tipAmount,
          }),
        });

        if (!createRes.ok) {
          throw new Error('Failed to create payment');
        }

        const { paymentIntentId } = await createRes.json();

        // Send to S700 reader
        setProcessingMessage('Waiting for card on reader...');
        const processRes = await fetch('/api/pos/process-terminal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId }),
        });

        if (!processRes.ok) {
          const errorData = await processRes.json();
          throw new Error(errorData.error || 'Payment failed');
        }

        // Poll for completion
        setProcessingMessage('Processing payment...');
        await pollPaymentStatus(paymentIntentId);

      } else {
        // Cash payment - just record it
        setProcessingMessage('Recording cash payment...');
        const res = await fetch('/api/pos/record-cash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointmentId: appointment.id,
            amount: remainingAmount,
            tipAmount: tipAmount,
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to record payment');
        }
      }

      // Mark appointment as complete
      await fetch('/api/pos/complete-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: appointment.id }),
      });

      setStep('complete');
      setTimeout(() => {
        onComplete();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setStep('error');
    }
  }

  async function pollPaymentStatus(paymentIntentId: string) {
    const maxAttempts = 60; // 2 minutes max
    let attempts = 0;

    while (attempts < maxAttempts) {
      const res = await fetch(`/api/pos/payment-status?id=${paymentIntentId}`);
      const { status } = await res.json();

      if (status === 'succeeded') {
        return;
      } else if (status === 'canceled' || status === 'requires_payment_method') {
        throw new Error('Payment was declined or canceled');
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;
    }

    throw new Error('Payment timed out');
  }

  async function cancelReaderAction() {
    await fetch('/api/pos/cancel-reader', { method: 'POST' });
    setStep('summary');
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Checkout</h2>
          {step !== 'processing' && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Summary Step */}
          {step === 'summary' && (
            <div className="space-y-6">
              {/* Client & Service */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-900">
                  {appointment.is_walk_in
                    ? appointment.walk_in_name || 'Walk-in'
                    : `${appointment.client?.first_name} ${appointment.client?.last_name}`}
                </p>
                <p className="text-sm text-gray-600 mt-1">{appointment.service?.name}</p>
                {appointment.addons && appointment.addons.length > 0 && (
                  <p className="text-sm text-gray-500">
                    + {appointment.addons.map((a) => a.service?.name).join(', ')}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  with {appointment.stylist?.first_name}
                </p>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Service Total</span>
                  <span>{formatCurrency(serviceAmount)}</span>
                </div>
                {depositPaid > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Deposit Paid</span>
                    <span>-{formatCurrency(depositPaid)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Remaining</span>
                  <span>{formatCurrency(remainingAmount)}</span>
                </div>
              </div>

              <button
                onClick={() => setStep('tip')}
                className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Continue to Tip
              </button>
            </div>
          )}

          {/* Tip Step */}
          {step === 'tip' && (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-600 mb-3">Add a tip for {appointment.stylist?.first_name}</p>
                
                {/* Preset Tips */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {TIP_PRESETS.map((percent) => (
                    <button
                      key={percent}
                      onClick={() => {
                        setTipPercent(percent);
                        setCustomTip('');
                      }}
                      className={`py-3 rounded-lg font-medium transition-colors ${
                        tipPercent === percent && !customTip
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {percent}%
                    </button>
                  ))}
                </div>

                {/* No Tip / Custom */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setTipPercent(null);
                      setCustomTip('');
                    }}
                    className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                      tipPercent === null && !customTip
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    No Tip
                  </button>
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      placeholder="Custom"
                      value={customTip}
                      onChange={(e) => {
                        setCustomTip(e.target.value);
                        setTipPercent(null);
                      }}
                      className="w-full py-3 pl-7 pr-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <p className="text-sm text-gray-600 mb-3">Payment Method</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaymentMethod('terminal')}
                    className={`flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      paymentMethod === 'terminal'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Card
                  </button>
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      paymentMethod === 'cash'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Cash
                  </button>
                </div>
              </div>

              {/* Total */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between text-gray-600 mb-1">
                  <span>Subtotal</span>
                  <span>{formatCurrency(remainingAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-600 mb-2">
                  <span>Tip</span>
                  <span>{formatCurrency(tipAmount)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('summary')}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={processPayment}
                  className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  {paymentMethod === 'terminal' ? 'Send to Reader' : 'Record Payment'}
                </button>
              </div>
            </div>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
              <p className="text-gray-900 font-medium">{processingMessage}</p>
              {paymentMethod === 'terminal' && (
                <>
                  <p className="text-sm text-gray-500 mt-2">
                    Customer should tap, insert, or swipe on the reader
                  </p>
                  <button
                    onClick={cancelReaderAction}
                    className="mt-6 text-red-600 hover:text-red-700 font-medium"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-xl font-bold text-gray-900">Payment Complete!</p>
              <p className="text-gray-500 mt-2">{formatCurrency(totalAmount)} collected</p>
            </div>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-xl font-bold text-gray-900">Payment Failed</p>
              <p className="text-red-600 mt-2">{error}</p>
              <button
                onClick={() => setStep('tip')}
                className="mt-6 px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
