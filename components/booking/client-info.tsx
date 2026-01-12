'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/currency';
import type { BookingData } from '@/app/(public)/book/page';

interface ClientInfoProps {
  bookingData: BookingData;
  onSubmit: (
    clientInfo: BookingData['clientInfo'],
    result: { appointmentId: string; paymentIntentClientSecret: string | null }
  ) => void;
  onBack: () => void;
}

export function ClientInfo({ bookingData, onSubmit, onBack }: ClientInfoProps) {
  const [formData, setFormData] = useState({
    firstName: bookingData.clientInfo?.firstName || '',
    lastName: bookingData.clientInfo?.lastName || '',
    email: bookingData.clientInfo?.email || '',
    phone: bookingData.clientInfo?.phone || '',
    notes: bookingData.clientInfo?.notes || '',
  });
  const [isNewClient, setIsNewClient] = useState(
    bookingData.clientInfo?.isNewClient ?? true
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (!agreedToPolicy) {
      newErrors.policy = 'Please agree to the cancellation policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Create the booking
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: bookingData.service?.id,
          stylist_id: bookingData.timeSlot?.stylist_id,
          start_time: bookingData.timeSlot?.start_time,
          addon_ids: bookingData.addons.map((a) => a.id),
          client: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            is_new: isNewClient,
          },
          notes: formData.notes,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create booking');
      }

      const result = await res.json();

      onSubmit(
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          notes: formData.notes,
          isNewClient,
        },
        {
          appointmentId: result.appointment.id,
          paymentIntentClientSecret: result.paymentIntent?.clientSecret || null,
        }
      );
    } catch (error) {
      console.error('Booking error:', error);
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  // Calculate totals
  const servicePrice = bookingData.service?.base_price || 0;
  const addonsPrice = bookingData.addons.reduce((sum, a) => sum + a.base_price, 0);
  const totalPrice = servicePrice + addonsPrice;
  const depositAmount = bookingData.service?.deposit_amount || 0;

  const formatDateTime = () => {
    if (!bookingData.timeSlot) return '';
    const date = new Date(bookingData.timeSlot.start_time);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Your Information</h2>
      <p className="text-white/50 mb-6">Almost done! Just need a few details</p>

      {/* Booking Summary */}
      <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-white mb-2">Booking Summary</h3>
        <div className="space-y-1 text-sm">
          <p className="text-white">
            <span className="font-medium">{bookingData.service?.name}</span>
            {bookingData.addons.length > 0 && (
              <span className="text-white/50">
                {' '}
                + {bookingData.addons.map((a) => a.name).join(', ')}
              </span>
            )}
          </p>
          <p className="text-white/60">{formatDateTime()}</p>
          <p className="text-white/60">with {bookingData.timeSlot?.stylist_name}</p>
        </div>
        <div className="mt-3 pt-3 border-t border-amber-400/20 flex justify-between">
          <span className="font-medium text-white">Total</span>
          <span className="font-bold text-amber-400">
            {formatCurrency(totalPrice * 100)}
          </span>
        </div>
        {bookingData.service?.deposit_required && (
          <p className="text-sm text-amber-400/80 mt-2">
            A {formatCurrency(depositAmount * 100)} deposit is required to secure your appointment
          </p>
        )}
      </div>

      {/* New/Returning Client Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setIsNewClient(true)}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
            isNewClient
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black'
              : 'bg-zinc-900 text-white/70 hover:bg-zinc-800 border border-white/20'
          }`}
        >
          I&apos;m New Here
        </button>
        <button
          type="button"
          onClick={() => setIsNewClient(false)}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
            !isNewClient
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black'
              : 'bg-zinc-900 text-white/70 hover:bg-zinc-800 border border-white/20'
          }`}
        >
          I&apos;ve Been Before
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-white/70 mb-1">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-zinc-900 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all ${
                errors.firstName ? 'border-red-500' : 'border-white/20'
              }`}
              placeholder="Jane"
            />
            {errors.firstName && (
              <p className="text-red-400 text-sm mt-1">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-white/70 mb-1">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-zinc-900 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all ${
                errors.lastName ? 'border-red-500' : 'border-white/20'
              }`}
              placeholder="Doe"
            />
            {errors.lastName && (
              <p className="text-red-400 text-sm mt-1">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-4 py-3 bg-zinc-900 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all ${
              errors.email ? 'border-red-500' : 'border-white/20'
            }`}
            placeholder="jane@example.com"
          />
          {errors.email && (
            <p className="text-red-400 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-white/70 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`w-full px-4 py-3 bg-zinc-900 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all ${
              errors.phone ? 'border-red-500' : 'border-white/20'
            }`}
            placeholder="(555) 123-4567"
          />
          {errors.phone && (
            <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
          )}
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-white/70 mb-1">
            Special Requests (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 bg-zinc-900 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            placeholder="Any special requests or things we should know?"
          />
        </div>

        {/* Cancellation Policy */}
        <div className="bg-zinc-900 border border-white/20 rounded-xl p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToPolicy}
              onChange={(e) => setAgreedToPolicy(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-white/30 bg-transparent text-amber-500 focus:ring-amber-500"
            />
            <span className="text-sm text-white/60">
              I understand that deposits are non-refundable. Appointments can be rescheduled
              with at least 24 hours notice. No-shows or late cancellations will forfeit the deposit.
            </span>
          </label>
          {errors.policy && (
            <p className="text-red-400 text-sm mt-2">{errors.policy}</p>
          )}
        </div>

        {/* Error message */}
        {errors.submit && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl">
            {errors.submit}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="flex-1 py-3 bg-zinc-900 border border-white/20 text-white rounded-xl font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black" />
                Processing...
              </>
            ) : bookingData.service?.deposit_required ? (
              `Pay ${formatCurrency(depositAmount * 100)} Deposit`
            ) : (
              'Confirm Booking'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
