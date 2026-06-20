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
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'past_7d' | 'past_30d'>('today');
  const [walkInRequests, setWalkInRequests] = useState<Array<{
    id: string;
    name: string;
    phone: string;
    email: string | null;
    heard_about: string | null;
    preferred_stylist_name: string | null;
    status: string;
    created_at: string;
  }>>([]);
  const [convertingRequestId, setConvertingRequestId] = useState<string | null>(null);
  const [walkInPrefill, setWalkInPrefill] = useState<{
    name?: string;
    phone?: string;
    email?: string;
  } | null>(null);
  const [walkInLoading, setWalkInLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, [dateRange]);

  useEffect(() => {
    fetchWalkInRequests();
  }, []);

  async function fetchAppointments() {
    setLoading(true);
    try {
      const res = await fetch(`/api/pos/appointments?range=${dateRange}`);
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  }

  // Backwards-compatible alias for the few places that still reference the
  // old function name (walk-in completion callback below).
  const fetchTodaysAppointments = fetchAppointments;

  async function fetchWalkInRequests() {
    setWalkInLoading(true);
    try {
      const res = await fetch('/api/pos/walk-in-requests');
      const data = await res.json();
      setWalkInRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to fetch walk-in requests:', error);
    } finally {
      setWalkInLoading(false);
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

    if (convertingRequestId) {
      try {
        await fetch('/api/pos/walk-in-requests', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: convertingRequestId,
            status: 'converted',
          }),
        });
      } catch (error) {
        console.error('Failed to mark walk-in as converted:', error);
      } finally {
        setConvertingRequestId(null);
        setWalkInPrefill(null);
      }
    }

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
    fetchWalkInRequests();
  }

  function handleConvertWalkInRequest(request: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  }) {
    setWalkInPrefill({
      name: request.name || '',
      phone: request.phone || '',
      email: request.email || '',
    });
    setConvertingRequestId(request.id);
    setSelectedAppointment(null);
    setIsCheckoutOpen(false);
    setIsWalkInOpen(true);
  }

  const filteredAppointments = appointments.filter((apt) => {
    if (filter === 'ready') return apt.status === 'in_progress' || apt.status === 'confirmed';
    if (filter === 'completed') return apt.status === 'completed';
    return true;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
      in_progress: 'bg-[#00ffb2] text-[#00ffb2] border-[#00ffb2]',
      completed: 'bg-green-100 text-green-700 border-green-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
      no_show: 'bg-stone-100 text-stone-600 border-stone-200',
    };
    return styles[status] || 'bg-stone-100 text-stone-600 border-stone-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-2xl border border-border shadow-lg px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-playfair font-bold text-white flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-[#00ffb2]" />
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
        {/* Walk-in Requests */}
        <div className="bg-card rounded-2xl border border-border shadow-lg px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Walk-in Check-ins</h2>
              <p className="text-white/60 text-sm">Latest submissions from the public walk-in page</p>
            </div>
            <button
              type="button"
              onClick={fetchWalkInRequests}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-white/5 text-white/70 hover:bg-white/10"
            >
              Refresh
            </button>
          </div>

          {walkInLoading ? (
            <div className="text-white/50 text-sm">Loading walk-ins...</div>
          ) : walkInRequests.length === 0 ? (
            <div className="text-white/50 text-sm">No walk-in check-ins yet.</div>
          ) : (
            <div className="space-y-3">
              {walkInRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-xl border border-border bg-background/40 px-4 py-3"
                >
                  <div>
                    <p className="text-white font-medium">{req.name}</p>
                    <p className="text-white/60 text-sm">{req.phone}</p>
                    <div className="text-xs text-white/40 mt-1">
                      {req.heard_about ? `Heard about us: ${req.heard_about}` : 'Heard about us: —'}
                    </div>
                  </div>
                  <div className="text-sm text-white/70">
                    Preferred stylist: {req.preferred_stylist_name || 'Any'}
                  </div>
                  <div className="text-xs text-white/50">
                    {new Date(req.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </div>
                  {req.status !== 'converted' && (
                    <button
                      type="button"
                      onClick={() => handleConvertWalkInRequest(req)}
                      className="px-3 py-2 rounded-lg text-sm font-medium bg-[#00ffb2] text-black hover:bg-[#00ffb2]"
                    >
                      Start Checkout
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Date Range Pills */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs uppercase tracking-wider text-white/40 font-semibold">Date range</span>
          {[
            { key: 'today', label: 'Today' },
            { key: 'yesterday', label: 'Yesterday' },
            { key: 'past_7d', label: 'Past 7 days' },
            { key: 'past_30d', label: 'Past 30 days' },
          ].map((opt) => (
            <button
              type="button"
              key={opt.key}
              onClick={() => setDateRange(opt.key as typeof dateRange)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                dateRange === opt.key
                  ? 'bg-[#00ffb2]/20 text-[#00ffb2] border border-[#00ffb2]/40'
                  : 'bg-white/3 text-white/60 hover:text-white border border-border'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'ready', label: 'Ready to Pay' },
            { key: 'completed', label: 'Completed' },
            { key: 'all', label: 'All' },
          ].map((tab) => (
            <button
              type="button"
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filter === tab.key
                  ? 'bg-[#00ffb2] text-black shadow-lg'
                  : 'bg-card text-white/70 hover:bg-muted border border-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Appointments Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ffb2]" />
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border shadow-sm">
            <p className="text-white/60">No appointments found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAppointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-card rounded-xl border border-border shadow-lg hover:shadow-xl transition-all overflow-hidden"
              >
                {/* Card Header */}
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <span className="font-medium text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#00ffb2]" />
                    {formatTime(apt.start_time)}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      apt.status === 'confirmed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      apt.status === 'in_progress' ? 'bg-[#00ffb2]/20 text-[#00ffb2] border-[#00ffb2]/30' :
                      apt.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                      'bg-white/10 text-white/60 border-border'
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
                      <Users className="w-4 h-4 text-[#00ffb2]" />
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
                    <p className="text-sm text-white">{apt.service?.name || 'Custom POS Charge'}</p>
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
                  {(() => {
                    const serviceTotal = Number(apt.final_price || apt.quoted_price || 0);
                    const depositPaid = (apt.payments || [])
                      .filter((p: any) => p.is_deposit && p.status === 'paid')
                      .reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
                    const balanceDue = Math.max(serviceTotal - depositPaid, 0);
                    const hasDeposit = depositPaid > 0;
                    const inactive = apt.status === 'completed' || apt.status === 'cancelled';
                    return (
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          {hasDeposit ? (
                            <>
                              <p className="text-xs text-white/40">
                                Service total {formatCurrency(serviceTotal * 100)}
                              </p>
                              <p className="text-xs text-green-400 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 shrink-0" />
                                {formatCurrency(depositPaid * 100)} deposit paid
                              </p>
                              <p className="text-xl font-bold text-[#00ffb2] mt-0.5">
                                {formatCurrency(balanceDue * 100)}{' '}
                                <span className="text-xs font-medium text-white/50">
                                  due at checkout
                                </span>
                              </p>
                            </>
                          ) : (
                            <p className="text-lg font-bold text-[#00ffb2]">
                              {formatCurrency(serviceTotal * 100)}
                            </p>
                          )}
                        </div>

                        {!inactive && (
                          <button
                            type="button"
                            onClick={() => handleCheckout(apt)}
                            className="px-4 py-2 bg-[#00ffb2] text-black rounded-xl font-medium  transition-all flex items-center gap-2 shrink-0"
                          >
                            <CreditCard className="w-4 h-4" />
                            {hasDeposit ? `Collect ${formatCurrency(balanceDue * 100)}` : 'Checkout'}
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Walk-in Button */}
        <div className="fixed bottom-6 right-6">
          <button
            type="button"
            onClick={() => {
              setConvertingRequestId(null);
              setWalkInPrefill(null);
              setIsWalkInOpen(true);
            }}
            className="px-6 py-3 bg-[#00ffb2] text-black rounded-full font-semibold shadow-lg hover:shadow-xl hover: transition-all flex items-center gap-2"
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
        prefill={walkInPrefill}
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
