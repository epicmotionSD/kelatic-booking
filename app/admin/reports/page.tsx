'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/currency';

interface ReportData {
  period: string;
  revenue: number;
  appointments: number;
  newClients: number;
  avgTicket: number;
  topServices: { name: string; revenue: number; count: number }[];
  topStylists: { name: string; revenue: number; appointments: number }[];
  dailyRevenue: { date: string; revenue: number; appointments: number }[];
  paymentBreakdown: { method: string; amount: number; count: number }[];
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [customRange, setCustomRange] = useState<{
    start: string;
    end: string;
  } | null>(null);

  useEffect(() => {
    fetchReports();
  }, [period]);

  async function fetchReports() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?period=${period}`);
      const data = await res.json();
      setData(data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-white/50">Track your business performance</p>
        </div>
        <div className="flex gap-2">
          {(['today', 'week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                period === p
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/50">Total Revenue</span>
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-amber-400">
            {formatCurrency((data?.revenue || 0) * 100)}
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/50">Appointments</span>
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-white">
            {data?.appointments || 0}
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/50">New Clients</span>
            <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-white">
            {data?.newClients || 0}
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/50">Avg. Ticket</span>
            <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-white">
            {formatCurrency((data?.avgTicket || 0) * 100)}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Revenue Chart Placeholder */}
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
          <h3 className="font-semibold text-white mb-4">Revenue Trend</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {data?.dailyRevenue?.slice(-14).map((day, index) => {
              const maxRevenue = Math.max(
                ...data.dailyRevenue.map((d) => d.revenue)
              );
              const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;

              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div
                    className="w-full bg-gradient-to-t from-amber-400 to-yellow-500 rounded-t transition-all hover:from-amber-300 hover:to-yellow-400"
                    style={{ height: `${Math.max(height, 4)}%` }}
                    title={`${day.date}: ${formatCurrency(day.revenue * 100)}`}
                  />
                  <span className="text-xs text-white/40 -rotate-45 origin-left">
                    {new Date(day.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
          <h3 className="font-semibold text-white mb-4">Payment Methods</h3>
          <div className="space-y-4">
            {data?.paymentBreakdown?.map((method) => {
              const total = data.paymentBreakdown.reduce(
                (sum, m) => sum + m.amount,
                0
              );
              const percentage = total > 0 ? (method.amount / total) * 100 : 0;

              return (
                <div key={method.method}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">
                      {method.method === 'card_terminal'
                        ? 'Card (POS)'
                        : method.method === 'card_online'
                        ? 'Card (Online)'
                        : method.method === 'cash'
                        ? 'Cash'
                        : method.method}
                    </span>
                    <span className="text-sm text-white/50">
                      {formatCurrency(method.amount * 100)} ({method.count})
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-amber-400 to-yellow-500 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {(!data?.paymentBreakdown || data.paymentBreakdown.length === 0) && (
              <p className="text-center text-white/50 py-8">No payment data</p>
            )}
          </div>
        </div>

        {/* Top Services */}
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
          <h3 className="font-semibold text-white mb-4">Top Services</h3>
          <div className="space-y-4">
            {data?.topServices?.slice(0, 5).map((service, index) => (
              <div key={service.name} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-amber-400/10 rounded-lg flex items-center justify-center text-amber-400 font-semibold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">
                    {service.name}
                  </p>
                  <p className="text-sm text-white/50">
                    {service.count} appointments
                  </p>
                </div>
                <p className="font-semibold text-amber-400">
                  {formatCurrency(service.revenue * 100)}
                </p>
              </div>
            ))}
            {(!data?.topServices || data.topServices.length === 0) && (
              <p className="text-center text-white/50 py-8">No service data</p>
            )}
          </div>
        </div>

        {/* Top Stylists */}
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
          <h3 className="font-semibold text-white mb-4">Stylist Performance</h3>
          <div className="space-y-4">
            {data?.topStylists?.map((stylist, index) => (
              <div key={stylist.name} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-amber-400/10 rounded-full flex items-center justify-center text-amber-400 font-medium text-sm">
                  {stylist.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">
                    {stylist.name}
                  </p>
                  <p className="text-sm text-white/50">
                    {stylist.appointments} appointments
                  </p>
                </div>
                <p className="font-semibold text-amber-400">
                  {formatCurrency(stylist.revenue * 100)}
                </p>
              </div>
            ))}
            {(!data?.topStylists || data.topStylists.length === 0) && (
              <p className="text-center text-white/50 py-8">No stylist data</p>
            )}
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="mt-8 bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-semibold text-white">Export Data</h3>
            <p className="text-sm text-white/50">
              Download reports for your records or accounting
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors text-sm border border-white/10">
              Export CSV
            </button>
            <button className="px-4 py-2 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors text-sm border border-white/10">
              Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
