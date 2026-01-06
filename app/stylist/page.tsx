'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/currency';
import { formatTime, formatDate, formatShortDate } from '@/lib/date-utils';

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
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  no_show: 'bg-red-100 text-red-800 border-red-200',
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
        <h1 className="text-3xl font-bold text-amber-900 mb-2">
          Welcome, {stylistName.split(' ')[0]} ✨
        </h1>
        <p className="text-amber-700/70">Time to create beautiful locs and make magic happen</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/70 backdrop-blur border border-amber-200 rounded-xl p-6 shadow-lg">
          <div className="text-3xl font-bold text-amber-900">{todayStats.total}</div>
          <div className="text-sm text-amber-700/70 font-medium">Total Appointments</div>
        </div>
        <div className="bg-green-50/80 border border-green-200 rounded-xl p-6 shadow-lg">
          <div className="text-3xl font-bold text-green-700">{todayStats.confirmed}</div>
          <div className="text-sm text-green-600/70 font-medium">Confirmed</div>
        </div>
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-6 shadow-lg">
          <div className="text-3xl font-bold text-amber-700">{todayStats.pending}</div>
          <div className="text-sm text-amber-600/70 font-medium">Pending</div>
        </div>
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6 shadow-lg">
          <div className="text-3xl font-bold text-orange-700">{formatCurrency(todayStats.revenue * 100)}</div>
          <div className="text-sm text-orange-600/70 font-medium">Expected Revenue</div>
        </div>
      </div>

      {/* View Toggle & Date Picker */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* View Toggle */}
        <div className="flex bg-white/70 rounded-xl p-1 border border-amber-200 shadow-md">
          <button
            onClick={() => setView('day')}
            className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              view === 'day'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                : 'text-amber-800 hover:bg-amber-100/80'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setView('upcoming')}
            className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              view === 'upcoming'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                : 'text-amber-800 hover:bg-amber-100/80'
            }`}
          >
            Upcoming
          </button>
        </div>

        {/* Date Picker (for day view) */}
        {view === 'day' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const prev = new Date(date);
                prev.setDate(prev.getDate() - 1);
                setDate(prev.toISOString().split('T')[0]);
              }}
              className="p-3 bg-white/70 border border-amber-200 rounded-lg hover:bg-amber-100/80 transition-all duration-200 text-amber-800 shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-4 py-3 bg-white/70 border border-amber-200 rounded-xl text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 shadow-sm"
            />
            <button
              onClick={() => {
                const next = new Date(date);
                next.setDate(next.getDate() + 1);
                setDate(next.toISOString().split('T')[0]);
              }}
              className="p-3 bg-white/70 border border-amber-200 rounded-lg hover:bg-amber-100/80 transition-all duration-200 text-amber-800 shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => setDate(new Date().toISOString().split('T')[0])}
              className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:shadow-md transition-all duration-200"
            >
              Today
            </button>
          </div>
        )}
      </div>

      {/* Date Header */}
      {view === 'day' && (
        <h2 className="text-xl font-semibold text-amber-900 mb-6">{formatDate(date)}</h2>
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
              className="bg-white/80 backdrop-blur border border-amber-200 rounded-xl p-6 hover:shadow-lg hover:bg-white/90 transition-all duration-200"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Time */}
                <div className="md:w-32 flex-shrink-0">
                  <div className="text-xl font-bold text-amber-700">
                    {formatTime(apt.start_time)}
                  </div>
                  <div className="text-sm text-amber-600/70 font-medium">
                    {apt.service_duration} min
                  </div>
                  {view === 'upcoming' && (
                    <div className="text-xs text-amber-600/60 mt-1 font-medium">
                      {formatShortDate(apt.start_time)}
                    </div>
                  )}
                </div>

                {/* Client & Service */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-amber-900">
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
                  <p className="text-amber-800 font-medium">{apt.service_name}</p>
                  {apt.client_notes && (
                    <p className="text-sm text-amber-700/70 mt-2 italic bg-amber-50 p-2 rounded-lg">
                      "{apt.client_notes}"
                    </p>
                  )}
                </div>

                {/* Contact & Price */}
                <div className="md:text-right flex-shrink-0">
                  <div className="text-xl font-bold text-amber-900">
                    {formatCurrency(apt.quoted_price * 100)}
                  </div>
                  {apt.client_phone && (
                    <a
                      href={`tel:${apt.client_phone}`}
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium"
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
