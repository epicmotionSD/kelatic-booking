'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/currency';
import { formatTime } from '@/lib/date-utils';
import { CheckoutModal } from '@/components/pos/checkout-modal';
import { WalkInModal } from '@/components/pos/walk-in-modal';
import { ReaderStatus } from '@/components/pos/reader-status';
import type { AppointmentWithDetails } from '@/types/database';

export default function POSPage() {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
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

  async function handleWalkInComplete(appointmentId: string) {
    setIsWalkInOpen(false);
    // Fetch the newly created appointment and open checkout
    try {
      const res = await fetch(`/api/admin/appointments/${appointmentId}`);
      const data = await res.json();
      if (data.appointment) {
        setSelectedAppointment(data.appointment);
        setIsCheckoutOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch walk-in appointment:', error);
    }
    fetchTodaysAppointments();
  }

  const filteredAppointments = appointments.filter((apt) => {
    if (filter === 'ready') return apt.status === 'in_progress' || apt.status === 'confirmed';
    if (filter === 'completed') return apt.status === 'completed';
    return true;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmed: 'bg-blue-500/20 text-blue-400',
      in_progress: 'bg-amber-500/20 text-amber-400',
      completed: 'bg-green-500/20 text-green-400',
      cancelled: 'bg-red-500/20 text-red-400',
      no_show: 'bg-white/10 text-white/50',
    };
    return styles[status] || 'bg-white/10 text-white/50';
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Point of Sale</h1>
            <p className="text-sm text-white/50">
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
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filter === tab.key
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Appointments Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-12 bg-white/5 backdrop-blur rounded-xl border border-white/10">
            <p className="text-white/50">No appointments found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAppointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-white/5 backdrop-blur rounded-xl border border-white/10 overflow-hidden"
              >
                {/* Card Header */}
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                  <span className="font-medium text-white">
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
                    <p className="font-semibold text-white">
                      {apt.is_walk_in
                        ? apt.walk_in_name || 'Walk-in'
                        : `${apt.client?.first_name} ${apt.client?.last_name}`}
                    </p>
                    {apt.client?.phone && (
                      <p className="text-sm text-white/50">{apt.client.phone}</p>
                    )}
                  </div>

                  {/* Service Info */}
                  <div className="mb-3">
                    <p className="text-sm text-white">{apt.service?.name}</p>
                    {apt.addons && apt.addons.length > 0 && (
                      <p className="text-xs text-white/50">
                        + {apt.addons.map((a) => a.service?.name).join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Stylist */}
                  <div className="mb-4">
                    <p className="text-sm text-white/50">
                      with {apt.stylist?.first_name}
                    </p>
                  </div>

                  {/* Price & Actions */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-amber-400">
                        {formatCurrency((apt.final_price || apt.quoted_price) * 100)}
                      </p>
                      {apt.payments?.some((p) => p.is_deposit && p.status === 'paid') && (
                        <p className="text-xs text-green-400">Deposit paid</p>
                      )}
                    </div>

                    {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCheckout(apt)}
                        className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-medium hover:shadow-lg hover:shadow-amber-500/30 transition-all"
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
            onClick={() => setIsWalkInOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full font-semibold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all flex items-center gap-2"
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

      {/* Walk-in Modal */}
      <WalkInModal
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        onComplete={handleWalkInComplete}
      />

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
