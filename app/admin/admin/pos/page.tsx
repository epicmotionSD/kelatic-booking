'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/stripe';
import { CheckoutModal } from '@/components/pos/checkout-modal';
import { ReaderStatus } from '@/components/pos/reader-status';
import type { AppointmentWithDetails } from '@/types/database';

export default function POSPage() {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'ready' | 'completed'>('ready');

  useEffect(() => {
    fetchTodaysAppointments();
  }, []);

  async function fetchTodaysAppointments() {
    setLoading(true);
    try {
      const res = await fetch('/api/pos/appointments');
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleCheckout(appointment: AppointmentWithDetails) {
    setSelectedAppointment(appointment);
    setIsCheckoutOpen(true);
  }

  function handleCheckoutComplete() {
    setIsCheckoutOpen(false);
    setSelectedAppointment(null);
    fetchTodaysAppointments(); // Refresh list
  }

  const filteredAppointments = appointments.filter((apt) => {
    if (filter === 'ready') return apt.status === 'in_progress' || apt.status === 'confirmed';
    if (filter === 'completed') return apt.status === 'completed';
    return true;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-gray-100 text-gray-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <ReaderStatus />
        </div>
      </header>

      <main className="p-6">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'ready', label: 'Ready to Pay' },
            { key: 'completed', label: 'Completed' },
            { key: 'all', label: 'All Today' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Appointments Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-500">No appointments found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAppointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Card Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    {formatTime(apt.start_time)}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                      apt.status
                    )}`}
                  >
                    {apt.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  {/* Client Info */}
                  <div className="mb-3">
                    <p className="font-semibold text-gray-900">
                      {apt.is_walk_in
                        ? apt.walk_in_name || 'Walk-in'
                        : `${apt.client?.first_name} ${apt.client?.last_name}`}
                    </p>
                    {apt.client?.phone && (
                      <p className="text-sm text-gray-500">{apt.client.phone}</p>
                    )}
                  </div>

                  {/* Service Info */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-700">{apt.service?.name}</p>
                    {apt.addons && apt.addons.length > 0 && (
                      <p className="text-xs text-gray-500">
                        + {apt.addons.map((a) => a.service?.name).join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Stylist */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">
                      with {apt.stylist?.first_name}
                    </p>
                  </div>

                  {/* Price & Actions */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency((apt.final_price || apt.quoted_price) * 100)}
                      </p>
                      {apt.payments?.some((p) => p.is_deposit && p.status === 'paid') && (
                        <p className="text-xs text-green-600">Deposit paid</p>
                      )}
                    </div>

                    {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCheckout(apt)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                      >
                        Checkout
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Walk-in Button */}
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => {
              // TODO: Open walk-in modal
            }}
            className="px-6 py-3 bg-gray-900 text-white rounded-full font-medium shadow-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Walk-in
          </button>
        </div>
      </main>

      {/* Checkout Modal */}
      {selectedAppointment && (
        <CheckoutModal
          appointment={selectedAppointment}
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          onComplete={handleCheckoutComplete}
        />
      )}
    </div>
  );
}
