'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  Scissors,
  Clock,
  Download,
  ChevronDown,
  Star,
  Repeat,
  UserPlus,
} from 'lucide-react';

type DateRange = '7d' | '30d' | '90d' | '12m' | 'custom';

interface ReportData {
  summary: {
    totalRevenue: number;
    revenueChange: number;
    totalBookings: number;
    bookingsChange: number;
    averageTicket: number;
    ticketChange: number;
    newClients: number;
    newClientsChange: number;
    completionRate: number;
    noShowRate: number;
    rebookingRate: number;
  };
  revenueByDay: Array<{ date: string; revenue: number; bookings: number }>;
  revenueByService: Array<{ category: string; revenue: number; count: number }>;
  topServices: Array<{ name: string; count: number; revenue: number }>;
  stylistPerformance: Array<{
    id: string;
    name: string;
    bookings: number;
    revenue: number;
    avgRating: number;
    completionRate: number;
  }>;
  peakHours: Array<{ hour: number; bookings: number }>;
  clientRetention: {
    newClients: number;
    returning: number;
    vip: number;
  };
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'team' | 'clients'>('overview');

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/reports?range=${dateRange}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demonstration
  const mockData: ReportData = {
    summary: {
      totalRevenue: 12450,
      revenueChange: 12.5,
      totalBookings: 89,
      bookingsChange: 8.3,
      averageTicket: 139.89,
      ticketChange: 3.8,
      newClients: 23,
      newClientsChange: 15.2,
      completionRate: 94.5,
      noShowRate: 3.2,
      rebookingRate: 68.5,
    },
    revenueByDay: [
      { date: '12/06', revenue: 1250, bookings: 8 },
      { date: '12/07', revenue: 1890, bookings: 12 },
      { date: '12/08', revenue: 980, bookings: 6 },
      { date: '12/09', revenue: 2100, bookings: 14 },
      { date: '12/10', revenue: 1650, bookings: 11 },
      { date: '12/11', revenue: 2340, bookings: 16 },
      { date: '12/12', revenue: 2240, bookings: 15 },
    ],
    revenueByService: [
      { category: 'Locs', revenue: 4500, count: 25 },
      { category: 'Braids', revenue: 3200, count: 18 },
      { category: 'Natural', revenue: 2100, count: 22 },
      { category: 'Silk Press', revenue: 1800, count: 15 },
      { category: 'Color', revenue: 850, count: 5 },
    ],
    topServices: [
      { name: 'Loc Retwist', count: 18, revenue: 2700 },
      { name: 'Knotless Braids', count: 12, revenue: 2400 },
      { name: 'Starter Locs', count: 8, revenue: 1600 },
      { name: 'Silk Press', count: 15, revenue: 1800 },
      { name: 'Loc Detox', count: 10, revenue: 1200 },
    ],
    stylistPerformance: [
      { id: '1', name: 'Rockal Roberts', bookings: 35, revenue: 5200, avgRating: 4.9, completionRate: 97 },
      { id: '2', name: 'Maya Johnson', bookings: 28, revenue: 3800, avgRating: 4.8, completionRate: 95 },
      { id: '3', name: 'Jasmine Lee', bookings: 26, revenue: 3450, avgRating: 4.7, completionRate: 92 },
    ],
    peakHours: [
      { hour: 9, bookings: 8 },
      { hour: 10, bookings: 12 },
      { hour: 11, bookings: 15 },
      { hour: 12, bookings: 10 },
      { hour: 13, bookings: 8 },
      { hour: 14, bookings: 14 },
      { hour: 15, bookings: 16 },
      { hour: 16, bookings: 12 },
      { hour: 17, bookings: 10 },
      { hour: 18, bookings: 6 },
    ],
    clientRetention: {
      newClients: 23,
      returning: 52,
      vip: 14,
    },
  };

  const displayData = data || mockData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getMaxRevenue = () => Math.max(...displayData.revenueByDay.map(d => d.revenue));
  const getMaxBookings = () => Math.max(...displayData.peakHours.map(d => d.bookings));
  const getMaxServiceRevenue = () => Math.max(...displayData.revenueByService.map(d => d.revenue));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Track your salon's performance</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="12m">Last 12 months</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Export Button */}
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'services', label: 'Services', icon: Scissors },
            { id: 'team', label: 'Team', icon: Users },
            { id: 'clients', label: 'Clients', icon: UserPlus },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  title="Total Revenue"
                  value={formatCurrency(displayData.summary.totalRevenue)}
                  change={displayData.summary.revenueChange}
                  icon={DollarSign}
                  color="green"
                />
                <KPICard
                  title="Bookings"
                  value={displayData.summary.totalBookings.toString()}
                  change={displayData.summary.bookingsChange}
                  icon={Calendar}
                  color="blue"
                />
                <KPICard
                  title="Avg. Ticket"
                  value={formatCurrency(displayData.summary.averageTicket)}
                  change={displayData.summary.ticketChange}
                  icon={TrendingUp}
                  color="purple"
                />
                <KPICard
                  title="New Clients"
                  value={displayData.summary.newClients.toString()}
                  change={displayData.summary.newClientsChange}
                  icon={UserPlus}
                  color="orange"
                />
              </div>

              {/* Secondary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{displayData.summary.completionRate}%</div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-bold text-red-500">{displayData.summary.noShowRate}%</div>
                  <div className="text-sm text-gray-600">No-Show Rate</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{displayData.summary.rebookingRate}%</div>
                  <div className="text-sm text-gray-600">Rebooking Rate</div>
                </div>
              </div>

              {/* Revenue Chart */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
                <div className="h-64 flex items-end gap-2">
                  {displayData.revenueByDay.map((day, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center">
                        <span className="text-xs text-gray-500 mb-1">{formatCurrency(day.revenue)}</span>
                        <div
                          className="w-full bg-purple-500 rounded-t-md transition-all hover:bg-purple-600"
                          style={{ height: `${(day.revenue / getMaxRevenue()) * 180}px` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">{day.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Peak Hours */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Booking Hours</h3>
                <div className="h-48 flex items-end gap-1">
                  {displayData.peakHours.map((hour, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-blue-400 rounded-t transition-all hover:bg-blue-500"
                        style={{ height: `${(hour.bookings / getMaxBookings()) * 140}px` }}
                      ></div>
                      <span className="text-xs text-gray-500">
                        {hour.hour > 12 ? `${hour.hour - 12}p` : `${hour.hour}a`}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-4 text-center">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Busiest hours: <strong>11am</strong> and <strong>3pm</strong>
                </p>
              </div>
            </div>
          )}

          {/* Services Tab */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              {/* Revenue by Category */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Category</h3>
                <div className="space-y-4">
                  {displayData.revenueByService.map((cat, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-900">{cat.category}</span>
                        <span className="text-gray-600">
                          {formatCurrency(cat.revenue)} ({cat.count} bookings)
                        </span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                          style={{ width: `${(cat.revenue / getMaxServiceRevenue()) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Services Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Top Services</h3>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Service</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Bookings</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Revenue</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Avg Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayData.topServices.map((service, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold text-sm">
                              {idx + 1}
                            </div>
                            <span className="font-medium text-gray-900">{service.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600">{service.count}</td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900">
                          {formatCurrency(service.revenue)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600">
                          {formatCurrency(service.revenue / service.count)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              {/* Stylist Performance Cards */}
              <div className="grid gap-4">
                {displayData.stylistPerformance.map((stylist, idx) => (
                  <div key={stylist.id} className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {stylist.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{stylist.name}</h4>
                          <div className="flex items-center gap-1 text-sm text-yellow-500">
                            <Star className="w-4 h-4 fill-current" />
                            <span>{stylist.avgRating}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">{stylist.bookings}</div>
                          <div className="text-sm text-gray-500">Bookings</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{formatCurrency(stylist.revenue)}</div>
                          <div className="text-sm text-gray-500">Revenue</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{stylist.completionRate}%</div>
                          <div className="text-sm text-gray-500">Completion</div>
                        </div>
                      </div>
                    </div>

                    {/* Performance Bar */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Revenue Share</span>
                        <span className="font-medium text-gray-900">
                          {((stylist.revenue / displayData.summary.totalRevenue) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${(stylist.revenue / displayData.summary.totalRevenue) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Team Summary */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">Team Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold">{displayData.stylistPerformance.length}</div>
                    <div className="text-purple-200">Active Stylists</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">
                      {(displayData.stylistPerformance.reduce((a, b) => a + b.avgRating, 0) / displayData.stylistPerformance.length).toFixed(1)}
                    </div>
                    <div className="text-purple-200">Avg Rating</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">
                      {Math.round(displayData.summary.totalBookings / displayData.stylistPerformance.length)}
                    </div>
                    <div className="text-purple-200">Avg Bookings/Stylist</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clients Tab */}
          {activeTab === 'clients' && (
            <div className="space-y-6">
              {/* Client Breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Client Breakdown</h3>
                <div className="flex items-center justify-center gap-8">
                  {/* Donut Chart Simulation */}
                  <div className="relative w-48 h-48">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      {/* VIP */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#9333ea"
                        strokeWidth="20"
                        strokeDasharray={`${(displayData.clientRetention.vip / (displayData.clientRetention.newClients + displayData.clientRetention.returning + displayData.clientRetention.vip)) * 251.2} 251.2`}
                        strokeDashoffset="0"
                      />
                      {/* Returning */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="20"
                        strokeDasharray={`${(displayData.clientRetention.returning / (displayData.clientRetention.newClients + displayData.clientRetention.returning + displayData.clientRetention.vip)) * 251.2} 251.2`}
                        strokeDashoffset={`-${(displayData.clientRetention.vip / (displayData.clientRetention.newClients + displayData.clientRetention.returning + displayData.clientRetention.vip)) * 251.2}`}
                      />
                      {/* New */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#c084fc"
                        strokeWidth="20"
                        strokeDasharray={`${(displayData.clientRetention.newClients / (displayData.clientRetention.newClients + displayData.clientRetention.returning + displayData.clientRetention.vip)) * 251.2} 251.2`}
                        strokeDashoffset={`-${((displayData.clientRetention.vip + displayData.clientRetention.returning) / (displayData.clientRetention.newClients + displayData.clientRetention.returning + displayData.clientRetention.vip)) * 251.2}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {displayData.clientRetention.newClients + displayData.clientRetention.returning + displayData.clientRetention.vip}
                        </div>
                        <div className="text-sm text-gray-500">Total</div>
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-purple-300 rounded"></div>
                      <div>
                        <div className="font-medium text-gray-900">New Clients</div>
                        <div className="text-sm text-gray-500">{displayData.clientRetention.newClients} clients</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-purple-400 rounded"></div>
                      <div>
                        <div className="font-medium text-gray-900">Returning</div>
                        <div className="text-sm text-gray-500">{displayData.clientRetention.returning} clients</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-purple-600 rounded"></div>
                      <div>
                        <div className="font-medium text-gray-900">VIP (10+ visits)</div>
                        <div className="text-sm text-gray-500">{displayData.clientRetention.vip} clients</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Retention Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Repeat className="w-5 h-5 text-green-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Retention Rate</h4>
                  </div>
                  <div className="text-3xl font-bold text-green-600">{displayData.summary.rebookingRate}%</div>
                  <p className="text-sm text-gray-500 mt-1">Clients who rebook within 6 weeks</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Client Lifetime Value</h4>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">$847</div>
                  <p className="text-sm text-gray-500 mt-1">Average revenue per client</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-purple-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Acquisition Cost</h4>
                  </div>
                  <div className="text-3xl font-bold text-purple-600">$12</div>
                  <p className="text-sm text-gray-500 mt-1">Average cost per new client</p>
                </div>
              </div>

              {/* Client Growth */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Growth Tips</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                    <div>
                      <div className="font-medium text-gray-900">Encourage VIP Referrals</div>
                      <div className="text-sm text-gray-600">Your 14 VIP clients could bring 28 new clients with a referral program</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                    <div>
                      <div className="font-medium text-gray-900">Reduce No-Shows</div>
                      <div className="text-sm text-gray-600">SMS reminders could recover ~$1,200/month from your 3.2% no-show rate</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                    <div>
                      <div className="font-medium text-gray-900">Book During Peak Hours</div>
                      <div className="text-sm text-gray-600">11am and 3pm slots fill fastest - premium pricing opportunity</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// KPI Card Component
function KPICard({
  title,
  value,
  change,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
  color: 'green' | 'blue' | 'purple' | 'orange';
}) {
  const colors = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {change >= 0 ? '+' : ''}{change.toFixed(1)}%
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{title}</div>
    </div>
  );
}
