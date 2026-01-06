'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/currency';
import { formatTime, formatDate } from '@/lib/date-utils';

interface Appointment {
  id: string;
  client_name: string;
  client_phone?: string;
  service_name: string;
  stylist_name: string;
  start_time: string;
  end_time: string;
  status: string;
  quoted_price: number;
  deposit_paid: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400',
  confirmed: 'bg-green-500/20 text-green-400',
  in_progress: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-white/10 text-white/60',
  cancelled: 'bg-red-500/20 text-red-400',
  no_show: 'bg-red-500/20 text-red-400',
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    status: 'all',
    stylist: 'all',
  });
  const [stylists, setStylists] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchAppointments();
    fetchStylists();
  }, [filters]);

  async function fetchAppointments() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        date: filters.date,
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.stylist !== 'all' && { stylist_id: filters.stylist }),
      });
      const res = await fetch(`/api/admin/appointments?${params}`);
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStylists() {
    try {
      const res = await fetch('/api/stylists');
      const data = await res.json();
      setStylists(
        data.stylists?.map((s: any) => ({
          id: s.id,
          name: `${s.first_name} ${s.last_name}`,
        })) || []
      );
    } catch (error) {
      console.error('Failed to fetch stylists:', error);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await fetch(`/api/admin/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchAppointments();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }



  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Appointments</h1>
          <p className="text-white/50">{formatDate(filters.date)}</p>
        </div>
        <Link
          href="/admin/appointments/new"
          className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all flex items-center gap-2 w-fit"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Appointment
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">
              Date
            </label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) =>
                setFilters({ ...filters, date: e.target.value })
              }
              className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
          </div>

          {/* Stylist */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">
              Stylist
            </label>
            <select
              value={filters.stylist}
              onChange={(e) =>
                setFilters({ ...filters, stylist: e.target.value })
              }
              className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
            >
              <option value="all">All Stylists</option>
              {stylists.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick date buttons */}
          <div className="flex items-end gap-2">
            <button
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setFilters({ ...filters, date: today });
              }}
              className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors border border-white/10"
            >
              Today
            </button>
            <button
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setFilters({ ...filters, date: tomorrow.toISOString().split('T')[0] });
              }}
              className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors border border-white/10"
            >
              Tomorrow
            </button>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12">
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
            <p className="text-white/50">No appointments found</p>
            <Link
              href="/admin/appointments/new"
              className="text-amber-400 hover:text-amber-300 mt-2 inline-block"
            >
              Create one →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/50 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/50 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/50 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/50 uppercase tracking-wider">
                    Stylist
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/50 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/50 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-white/50 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {formatTime(apt.start_time)}
                      </div>
                      <div className="text-xs text-white/50">
                        - {formatTime(apt.end_time)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {apt.client_name || 'Walk-in'}
                      </div>
                      {apt.client_phone && (
                        <div className="text-xs text-white/50">
                          {apt.client_phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {apt.service_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {apt.stylist_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {formatCurrency(apt.quoted_price * 100)}
                      </div>
                      {apt.deposit_paid > 0 && (
                        <div className="text-xs text-green-400">
                          {formatCurrency(apt.deposit_paid * 100)} deposit
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          STATUS_COLORS[apt.status] || 'bg-white/10 text-white/60'
                        }`}
                      >
                        {apt.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {apt.status === 'pending' && (
                          <button
                            onClick={() => updateStatus(apt.id, 'confirmed')}
                            className="text-green-400 hover:text-green-300 text-sm"
                          >
                            Confirm
                          </button>
                        )}
                        {apt.status === 'confirmed' && (
                          <button
                            onClick={() => updateStatus(apt.id, 'in_progress')}
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            Start
                          </button>
                        )}
                        {apt.status === 'in_progress' && (
                          <Link
                            href={`/admin/pos?appointment=${apt.id}`}
                            className="text-green-400 hover:text-green-300 text-sm"
                          >
                            Checkout
                          </Link>
                        )}
                        <Link
                          href={`/admin/appointments/${apt.id}`}
                          className="text-white/50 hover:text-white"
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
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
