'use client';

import { formatCurrency } from '@/lib/stripe';
import type { BookingData } from '@/app/(public)/book/page';

interface ConfirmationProps {
  bookingData: BookingData;
}

export function Confirmation({ bookingData }: ConfirmationProps) {
  const formatDateTime = (): { date: string; time: string } => {
    if (!bookingData.timeSlot) return { date: '', time: '' };
    const d = new Date(bookingData.timeSlot.start_time);
    return {
      date: d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      time: d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  const { date, time } = formatDateTime();

  const servicePrice = bookingData.service?.base_price || 0;
  const addonsPrice = bookingData.addons.reduce((sum, a) => sum + a.base_price, 0);
  const totalPrice = servicePrice + addonsPrice;
  const depositPaid = bookingData.service?.deposit_required
    ? bookingData.service.deposit_amount || 0
    : 0;
  const balanceDue = totalPrice - depositPaid;

  function addToCalendar() {
    if (!bookingData.timeSlot || !bookingData.service) return;

    const startDate = new Date(bookingData.timeSlot.start_time);
    const endDate = new Date(bookingData.timeSlot.end_time);

    const event = {
      title: `${bookingData.service.name} at KeLatic Hair Lounge`,
      start: startDate.toISOString().replace(/-|:|\.\d{3}/g, ''),
      end: endDate.toISOString().replace(/-|:|\.\d{3}/g, ''),
      location: '123 Main Street, Your City, ST 12345',
      description: `Appointment with ${bookingData.timeSlot.stylist_name}`,
    };

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      event.title
    )}&dates=${event.start}/${event.end}&location=${encodeURIComponent(
      event.location
    )}&details=${encodeURIComponent(event.description)}`;

    window.open(googleUrl, '_blank');
  }

  return (
    <div className="text-center">
      {/* Success Icon */}
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg
          className="w-10 h-10 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re All Set!</h2>
      <p className="text-gray-500 mb-8">
        We&apos;ve sent a confirmation email to{' '}
        <span className="font-medium text-gray-900">{bookingData.clientInfo?.email}</span>
      </p>

      {/* Appointment Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-left mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Appointment Details</h3>

        <div className="space-y-4">
          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">{date}</p>
              <p className="text-gray-600">{time}</p>
            </div>
          </div>

          {/* Service */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">{bookingData.service?.name}</p>
              {bookingData.addons.length > 0 && (
                <p className="text-gray-600">
                  + {bookingData.addons.map((a) => a.name).join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* Stylist */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {bookingData.timeSlot?.stylist_name}
              </p>
              <p className="text-gray-600">Your Stylist</p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">KeLatic Hair Lounge</p>
              <p className="text-gray-600">123 Main Street, Your City, ST 12345</p>
            </div>
          </div>
        </div>

        {/* Price Summary */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Service Total</span>
            <span>{formatCurrency(totalPrice * 100)}</span>
          </div>
          {depositPaid > 0 && (
            <div className="flex justify-between text-sm text-green-600 mb-1">
              <span>Deposit Paid</span>
              <span>-{formatCurrency(depositPaid * 100)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-gray-900 mt-2 pt-2 border-t border-gray-100">
            <span>Balance Due at Appointment</span>
            <span>{formatCurrency(balanceDue * 100)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={addToCalendar}
          className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Add to Calendar
        </button>

        <a
          href="/"
          className="block w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-center"
        >
          Back to Home
        </a>
      </div>

      {/* Reminders */}
      <div className="mt-8 bg-amber-50 rounded-xl p-4 text-left">
        <h4 className="font-semibold text-amber-800 mb-2">Before Your Appointment</h4>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• Please arrive 5-10 minutes early</li>
          <li>• Come with clean, product-free hair (unless otherwise specified)</li>
          <li>• Bring inspiration photos if you have a specific style in mind</li>
          <li>• Contact us at least 24 hours in advance to reschedule</li>
        </ul>
      </div>

      {/* Contact */}
      <p className="text-sm text-gray-500 mt-6">
        Questions? Call us at{' '}
        <a href="tel:5551234567" className="text-purple-600 hover:underline">
          (555) 123-4567
        </a>
      </p>
    </div>
  );
}
