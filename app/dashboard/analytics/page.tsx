// =============================================================================
// ANALYTICS PAGE
// /app/dashboard/analytics/page.tsx
// Campaign performance analytics and ROI tracking
// =============================================================================

'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  DollarSign,
  Users,
  MessageSquare,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalRevenue: number
    revenueChange: number
    totalBookings: number
    bookingsChange: number
    avgResponseRate: number
    avgROI: number
  }
  monthlyTrend: Array<{
    month: string
    revenue: number
    bookings: number
    campaigns: number
  }>
  segmentPerformance: Array<{
    segment: string
    leads: number
    responses: number
    bookings: number
    revenue: number
    conversionRate: number
  }>
  topCampaigns: Array<{
    id: string
    name: string
    revenue: number
    bookings: number
    roi: number
  }>
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30d')

  useEffect(() => {
    // Mock data for now - will connect to API
    setData({
      overview: {
        totalRevenue: 12450,
        revenueChange: 23.5,
        totalBookings: 47,
        bookingsChange: 15.2,
        avgResponseRate: 8.3,
        avgROI: 340,
      },
      monthlyTrend: [
        { month: 'Oct', revenue: 3200, bookings: 12, campaigns: 2 },
        { month: 'Nov', revenue: 4100, bookings: 15, campaigns: 3 },
        { month: 'Dec', revenue: 5150, bookings: 20, campaigns: 2 },
      ],
      segmentPerformance: [
        { segment: 'Ghost', leads: 245, responses: 18, bookings: 8, revenue: 2400, conversionRate: 3.3 },
        { segment: 'Near-Miss', leads: 156, responses: 24, bookings: 19, revenue: 5700, conversionRate: 12.2 },
        { segment: 'VIP', leads: 89, responses: 31, bookings: 20, revenue: 4350, conversionRate: 22.5 },
      ],
      topCampaigns: [
        { id: '1', name: 'December VIP Reactivation', revenue: 3200, bookings: 12, roi: 480 },
        { id: '2', name: 'Holiday Near-Miss', revenue: 2800, bookings: 11, roi: 350 },
        { id: '3', name: 'Q4 Ghost Recovery', revenue: 1850, bookings: 8, roi: 220 },
      ],
    })
    setLoading(false)
  }, [dateRange])

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-400">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-zinc-400">Track your campaign performance and ROI</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Total Revenue"
          value={`$${data.overview.totalRevenue.toLocaleString()}`}
          change={data.overview.revenueChange}
          icon={<DollarSign className="w-5 h-5" />}
          color="emerald"
        />
        <MetricCard
          label="Bookings"
          value={data.overview.totalBookings}
          change={data.overview.bookingsChange}
          icon={<Calendar className="w-5 h-5" />}
          color="cyan"
        />
        <MetricCard
          label="Response Rate"
          value={`${data.overview.avgResponseRate}%`}
          change={0}
          icon={<MessageSquare className="w-5 h-5" />}
          color="purple"
        />
        <MetricCard
          label="Average ROI"
          value={`${data.overview.avgROI}%`}
          change={0}
          icon={<TrendingUp className="w-5 h-5" />}
          color="blue"
        />
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Segment Performance */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-purple-400" />
            <h2 className="font-semibold text-white">Segment Performance</h2>
          </div>
          <div className="space-y-4">
            {data.segmentPerformance.map((seg) => (
              <div key={seg.segment} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    seg.segment === 'VIP' ? 'bg-emerald-500' :
                    seg.segment === 'Near-Miss' ? 'bg-cyan-500' : 'bg-zinc-500'
                  }`} />
                  <span className="text-zinc-300">{seg.segment}</span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <span className="text-zinc-500">{seg.leads} leads</span>
                  <span className="text-zinc-400">{seg.bookings} bookings</span>
                  <span className="text-emerald-400 font-medium">${seg.revenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Campaigns */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h2 className="font-semibold text-white">Top Campaigns</h2>
          </div>
          <div className="space-y-4">
            {data.topCampaigns.map((campaign, i) => (
              <div key={campaign.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500 text-sm w-4">{i + 1}.</span>
                  <span className="text-zinc-300">{campaign.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-emerald-400 font-medium">${campaign.revenue.toLocaleString()}</span>
                  <span className="text-cyan-400">{campaign.roi}% ROI</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h2 className="font-semibold text-white">Monthly Trend</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {data.monthlyTrend.map((month) => (
            <div key={month.month} className="bg-zinc-800/50 rounded-lg p-4">
              <p className="text-zinc-500 text-sm mb-2">{month.month}</p>
              <p className="text-xl font-bold text-white">${month.revenue.toLocaleString()}</p>
              <p className="text-sm text-zinc-400">{month.bookings} bookings</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  change,
  icon,
  color,
}: {
  label: string
  value: string | number
  change: number
  icon: React.ReactNode
  color: string
}) {
  const isPositive = change >= 0

  const colorClasses: Record<string, string> = {
    emerald: 'text-emerald-400 bg-emerald-500/10',
    cyan: 'text-cyan-400 bg-cyan-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
  }

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        {change !== 0 && (
          <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-zinc-500">{label}</p>
    </div>
  )
}
