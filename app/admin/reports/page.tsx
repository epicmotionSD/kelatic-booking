'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/currency';
import { BarChart3, DollarSign, Calendar, Users, UserPlus, TrendingUp } from 'lucide-react';

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-stone-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-amber-600" />
            Reports
          </h1>
          <p className="text-stone-600">Track your business performance</p>
        </div>
        <div className="flex gap-2">
          {(['today', 'week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                period === p
                  ? 'bg-amber-500 text-white shadow-lg'
                  : 'bg-white text-stone-700 hover:bg-amber-50 border border-stone-200'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-amber-200 shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-stone-600">Total Revenue</span>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-amber-600">
            {formatCurrency((data?.revenue || 0) * 100)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-amber-200 shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-stone-600">Appointments</span>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-stone-900">
            {data?.appointments || 0}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-amber-200 shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-stone-600">New Clients</span>
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-stone-900">
            {data?.newClients || 0}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-amber-200 shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-stone-600">Avg. Ticket</span>
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-stone-900">
            {formatCurrency((data?.avgTicket || 0) * 100)}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Revenue Chart Placeholder */}
        <div className="bg-white rounded-xl border border-amber-200 shadow-lg p-6">
          <h3 className="font-playfair font-semibold text-stone-900 mb-4">Revenue Trend</h3>
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
                  <span className="text-xs text-stone-400 -rotate-45 origin-left">
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
        <div className="bg-white rounded-xl border border-amber-200 shadow-lg p-6">
          <h3 className="font-playfair font-semibold text-stone-900 mb-4">Payment Methods</h3>
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
                    <span className="text-sm font-medium text-stone-900">
                      {method.method === 'card_terminal'
                        ? 'Card (POS)'
                        : method.method === 'card_online'
                        ? 'Card (Online)'
                        : method.method === 'cash'
                        ? 'Cash'
                        : method.method}
                    </span>
                    <span className="text-sm text-stone-600">
                      {formatCurrency(method.amount * 100)} ({method.count})
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-amber-400 to-yellow-500 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {(!data?.paymentBreakdown || data.paymentBreakdown.length === 0) && (
              <p className="text-center text-stone-500 py-8">No payment data</p>
            )}
          </div>
        </div>

        {/* Top Services */}
        <div className="bg-white rounded-xl border border-amber-200 shadow-lg p-6">
          <h3 className="font-playfair font-semibold text-stone-900 mb-4">Top Services</h3>
          <div className="space-y-4">
            {data?.topServices?.slice(0, 5).map((service, index) => (
              <div key={service.name} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 font-semibold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-900 truncate">
                    {service.name}
                  </p>
                  <p className="text-sm text-stone-600">
                    {service.count} appointments
                  </p>
                </div>
                <p className="font-semibold text-amber-600">
                  {formatCurrency(service.revenue * 100)}
                </p>
              </div>
            ))}
            {(!data?.topServices || data.topServices.length === 0) && (
              <p className="text-center text-stone-500 py-8">No service data</p>
            )}
          </div>
        </div>

        {/* Top Stylists */}
        <div className="bg-white rounded-xl border border-amber-200 shadow-lg p-6">
          <h3 className="font-playfair font-semibold text-stone-900 mb-4">Stylist Performance</h3>
          <div className="space-y-4">
            {data?.topStylists?.map((stylist, index) => (
              <div key={stylist.name} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-medium text-sm">
                  {stylist.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-900 truncate">
                    {stylist.name}
                  </p>
                  <p className="text-sm text-stone-600">
                    {stylist.appointments} appointments
                  </p>
                </div>
                <p className="font-semibold text-amber-600">
                  {formatCurrency(stylist.revenue * 100)}
                </p>
              </div>
            ))}
            {(!data?.topStylists || data.topStylists.length === 0) && (
              <p className="text-center text-stone-500 py-8">No stylist data</p>
            )}
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="mt-8 bg-white rounded-xl border border-amber-200 shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="font-playfair font-semibold text-stone-900">Export Data</h3>
              <p className="text-sm text-stone-600">
                Download reports for your records or accounting
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white text-stone-700 rounded-xl hover:bg-amber-50 transition-colors text-sm border border-stone-200">
              Export CSV
            </button>
            <button className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors text-sm shadow-lg">
              Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
