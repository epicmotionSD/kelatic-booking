'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/currency';

interface Appointment {
  id: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  service_name: string;
  service_duration: number;
  start_time: string;
  end_time: string;
  status: string;
  quoted_price: number;
  client_notes?: string;
  stylist_notes?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  confirmed: 'bg-green-500/20 text-green-400 border-green-500/30',
  in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  completed: 'bg-white/10 text-white/60 border-white/20',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  no_show: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function StylistDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [view, setView] = useState<'day' | 'upcoming'>('day');
  const [stylistName, setStylistName] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, [date, view]);

  async function fetchAppointments() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        view,
        ...(view === 'day' && { date }),
      });
      const res = await fetch(`/api/stylist/appointments?${params}`);
      const data = await res.json();

      if (res.ok) {
        setAppointments(data.appointments || []);
        setStylistName(data.stylist?.name || '');
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(isoString: string) {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  function formatFullDate(isoString: string) {
    return new Date(isoString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  // Calculate stats
  const todayStats = {
    total: appointments.length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    pending: appointments.filter(a => a.status === 'pending').length,
    revenue: appointments
      .filter(a => ['confirmed', 'in_progress', 'completed'].includes(a.status))
      .reduce((sum, a) => sum + a.quoted_price, 0),
  };

  return (
    <div className="py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          Welcome, {stylistName.split(' ')[0]}
        </h1>
        <p className="text-white/50">Here's your schedule for today</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{todayStats.total}</div>
          <div className="text-sm text-white/50">Total Appointments</div>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-400">{todayStats.confirmed}</div>
          <div className="text-sm text-white/50">Confirmed</div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <div className="text-2xl font-bold text-amber-400">{todayStats.pending}</div>
          <div className="text-sm text-white/50">Pending</div>
        </div>
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
          <div className="text-2xl font-bold text-amber-400">{formatCurrency(todayStats.revenue * 100)}</div>
          <div className="text-sm text-white/50">Expected Revenue</div>
        </div>
      </div>

      {/* View Toggle & Date Picker */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* View Toggle */}
        <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
          <button
            onClick={() => setView('day')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'day'
                ? 'bg-amber-400 text-black'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setView('upcoming')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'upcoming'
                ? 'bg-amber-400 text-black'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Upcoming
          </button>
        </div>

        {/* Date Picker (for day view) */}
        {view === 'day' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const prev = new Date(date);
                prev.setDate(prev.getDate() - 1);
                setDate(prev.toISOString().split('T')[0]);
              }}
              className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-400/50"
            />
            <button
              onClick={() => {
                const next = new Date(date);
                next.setDate(next.getDate() + 1);
                setDate(next.toISOString().split('T')[0]);
              }}
              className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => setDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors"
            >
              Today
            </button>
          </div>
        )}
      </div>

      {/* Date Header */}
      {view === 'day' && (
        <h2 className="text-lg font-semibold text-white/80 mb-4">{formatDate(date)}</h2>
      )}

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
            <p className="text-white/50 text-lg mb-2">No appointments</p>
            <p className="text-white/30 text-sm">
              {view === 'day' ? 'Enjoy your day off!' : 'No upcoming appointments scheduled'}
            </p>
          </div>
        ) : (
          appointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Time */}
                <div className="md:w-32 flex-shrink-0">
                  <div className="text-lg font-bold text-amber-400">
                    {formatTime(apt.start_time)}
                  </div>
                  <div className="text-sm text-white/50">
                    {apt.service_duration} min
                  </div>
                  {view === 'upcoming' && (
                    <div className="text-xs text-white/40 mt-1">
                      {formatFullDate(apt.start_time)}
                    </div>
                  )}
                </div>

                {/* Client & Service */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-white">
                      {apt.client_name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                        STATUS_COLORS[apt.status] || 'bg-white/10 text-white/60'
                      }`}
                    >
                      {apt.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-white/70">{apt.service_name}</p>
                  {apt.client_notes && (
                    <p className="text-sm text-white/50 mt-2 italic">
                      "{apt.client_notes}"
                    </p>
                  )}
                </div>

                {/* Contact & Price */}
                <div className="md:text-right flex-shrink-0">
                  <div className="text-lg font-bold text-white">
                    {formatCurrency(apt.quoted_price * 100)}
                  </div>
                  {apt.client_phone && (
                    <a
                      href={`tel:${apt.client_phone}`}
                      className="text-sm text-amber-400 hover:text-amber-300"
                    >
                      {apt.client_phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
