'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/currency';

interface Appointment {
  id: string;
  stylist_name: string;
  stylist_id?: string;
  service_name: string;
  service_duration: number;
  start_time: string;
  end_time: string;
  status: string;
  quoted_price: number;
  final_price?: number;
  client_notes?: string;
}

interface ClientInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending Confirmation', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  confirmed: { label: 'Confirmed', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  completed: { label: 'Completed', color: 'bg-white/10 text-white/60 border-white/20' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  no_show: { label: 'Missed', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export default function AccountPage() {
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    setLoading(true);
    try {
      // Fetch upcoming and past in parallel
      const [upcomingRes, pastRes] = await Promise.all([
        fetch('/api/client/appointments?view=upcoming'),
        fetch('/api/client/appointments?view=past&limit=10'),
      ]);

      if (upcomingRes.ok) {
        const data = await upcomingRes.json();
        setUpcomingAppointments(data.appointments || []);
        setClient(data.client);
      }

      if (pastRes.ok) {
        const data = await pastRes.json();
        setPastAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDateTime(isoString: string) {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
  }

  function isWithin24Hours(isoString: string) {
    const appointmentDate = new Date(isoString);
    const now = new Date();
    const diff = appointmentDate.getTime() - now.getTime();
    return diff > 0 && diff < 24 * 60 * 60 * 1000;
  }

  const appointments = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  return (
    <div className="py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          Welcome back{client ? `, ${client.name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-white/50">Manage your appointments</p>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Link
          href="/book"
          className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl p-5 hover:shadow-lg hover:shadow-amber-500/30 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-lg">Book Appointment</div>
              <div className="text-black/70 text-sm">Schedule your next visit</div>
            </div>
          </div>
        </Link>

        <a
          href="tel:+17134854000"
          className="bg-white/5 border border-white/10 text-white rounded-xl p-5 hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-400/10 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-lg">Call Us</div>
              <div className="text-white/50 text-sm">(713) 485-4000</div>
            </div>
          </div>
        </a>
      </div>

      {/* Tabs */}
      <div className="flex bg-white/5 rounded-xl p-1 border border-white/10 mb-6">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'upcoming'
              ? 'bg-amber-400 text-black'
              : 'text-white/70 hover:text-white'
          }`}
        >
          Upcoming ({upcomingAppointments.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'past'
              ? 'bg-amber-400 text-black'
              : 'text-white/70 hover:text-white'
          }`}
        >
          Past ({pastAppointments.length})
        </button>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
            <svg
              className="w-12 h-12 mx-auto text-white/20 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {activeTab === 'upcoming' ? (
              <>
                <p className="text-white/50 text-lg mb-2">No upcoming appointments</p>
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full font-bold mt-4 hover:shadow-lg hover:shadow-amber-500/30 transition-all"
                >
                  Book Now
                </Link>
              </>
            ) : (
              <p className="text-white/50 text-lg">No past appointments</p>
            )}
          </div>
        ) : (
          appointments.map((apt) => {
            const { date, time } = formatDateTime(apt.start_time);
            const statusInfo = STATUS_LABELS[apt.status] || STATUS_LABELS.pending;
            const isSoon = isWithin24Hours(apt.start_time);

            return (
              <div
                key={apt.id}
                className={`bg-white/5 backdrop-blur border rounded-xl p-5 ${
                  isSoon && activeTab === 'upcoming'
                    ? 'border-amber-400/50 bg-amber-400/5'
                    : 'border-white/10'
                }`}
              >
                {isSoon && activeTab === 'upcoming' && (
                  <div className="flex items-center gap-2 mb-3 text-amber-400 text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Coming up soon!
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Date & Time */}
                  <div className="sm:w-40 flex-shrink-0">
                    <div className="text-lg font-bold text-amber-400">{time}</div>
                    <div className="text-sm text-white/70">{date}</div>
                  </div>

                  {/* Service & Stylist */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-white">
                        {apt.service_name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-white/70">with {apt.stylist_name}</p>
                    <p className="text-white/50 text-sm">{apt.service_duration} minutes</p>
                  </div>

                  {/* Price & Actions */}
                  <div className="sm:text-right flex-shrink-0 flex sm:flex-col items-center sm:items-end gap-3">
                    <div className="text-lg font-bold text-white">
                      {formatCurrency((apt.final_price || apt.quoted_price) * 100)}
                    </div>
                    {activeTab === 'past' && apt.stylist_id && apt.status === 'completed' && (
                      <Link
                        href={`/book?stylist=${apt.stylist_id}`}
                        className="text-sm text-amber-400 hover:text-amber-300"
                      >
                        Book again
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
