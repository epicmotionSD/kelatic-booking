'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/currency';
import { Plus, Calendar, Filter, Users, Clock } from 'lucide-react';

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
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  confirmed: 'bg-green-100 text-green-700 border-green-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-stone-100 text-stone-600 border-stone-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  no_show: 'bg-red-100 text-red-700 border-red-200',
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-stone-900 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-amber-600" />
            Sacred Sessions
          </h1>
          <p className="text-stone-600">{formatDate(filters.date)}</p>
        </div>
        <Link
          href="/admin/appointments/new"
          className="px-4 py-2 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-all flex items-center gap-2 w-fit"
        >
          <Plus className="w-5 h-5" />
          New Appointment
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-amber-200 p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap gap-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) =>
                setFilters({ ...filters, date: e.target.value })
              }
              className="px-4 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="px-4 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
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
