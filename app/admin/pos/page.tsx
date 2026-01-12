'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/currency';
import { formatTime } from '@/lib/date-utils';
import { CheckoutModal } from '@/components/pos/checkout-modal';
import { WalkInModal } from '@/components/pos/walk-in-modal';
import { ReaderStatus } from '@/components/pos/reader-status';
import { CreditCard, Users, Clock, UserPlus, CheckCircle } from 'lucide-react';
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
      confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
      in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
      completed: 'bg-green-100 text-green-700 border-green-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
      no_show: 'bg-stone-100 text-stone-600 border-stone-200',
    };
    return styles[status] || 'bg-stone-100 text-stone-600 border-stone-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900 rounded-2xl border border-white/10 shadow-lg px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-playfair font-bold text-white flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-amber-400" />
              Point of Sale
            </h1>
            <p className="text-white/60 mt-1">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <ReaderStatus />
        </div>
      </div>

      <main className="space-y-6">
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
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg'
                  : 'bg-zinc-900 text-white/70 hover:bg-zinc-800 border border-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Appointments Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900 rounded-xl border border-white/10 shadow-sm">
            <p className="text-white/60">No appointments found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAppointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-zinc-900 rounded-xl border border-white/10 shadow-lg hover:shadow-xl transition-all overflow-hidden"
              >
                {/* Card Header */}
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                  <span className="font-medium text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    {formatTime(apt.start_time)}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      apt.status === 'confirmed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      apt.status === 'in_progress' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                      apt.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                      'bg-white/10 text-white/60 border-white/20'
                    }`}
                  >
                    {apt.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  {/* Client Info */}
                  <div className="mb-3">
                    <p className="font-semibold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-400" />
                      {apt.is_walk_in
                        ? apt.walk_in_name || 'Walk-in'
                        : `${apt.client?.first_name} ${apt.client?.last_name}`}
                    </p>
                    {apt.client?.phone && (
                      <p className="text-sm text-white/60">{apt.client.phone}</p>
                    )}
                  </div>

                  {/* Service Info */}
                  <div className="mb-3">
                    <p className="text-sm text-white">{apt.service?.name}</p>
                    {apt.addons && apt.addons.length > 0 && (
                      <p className="text-xs text-white/60">
                        + {apt.addons.map((a) => a.service?.name).join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Stylist */}
                  <div className="mb-4">
                    <p className="text-sm text-white/60">
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
                        <p className="text-xs text-green-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Deposit paid
                        </p>
                      )}
                    </div>

                    {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCheckout(apt)}
                        className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-medium hover:shadow-lg hover:shadow-amber-500/30 transition-all flex items-center gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
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
            className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full font-semibold shadow-lg hover:shadow-xl hover:shadow-amber-500/30 transition-all flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
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
