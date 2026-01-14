// =============================================================================
// DASHBOARD OVERVIEW PAGE
// /app/dashboard/page.tsx
// Main dashboard with high-level metrics and quick actions
// =============================================================================

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  Users,
  DollarSign,
  MessageSquare,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ChevronRight,
  Phone,
  Zap,
  Calendar,
  Target,
} from 'lucide-react'

interface DashboardData {
  metrics: {
    totalRevenue: number
    revenueChange: number
    totalBookings: number
    bookingsChange: number
    activeLeads: number
    leadsChange: number
    responseRate: number
    responseRateChange: number
  }
  activeCampaigns: Array<{
    id: string
    name: string
    progress: number
    hotLeads: number
    status: string
  }>
  hotLeads: Array<{
    id: string
    name: string
    phone: string
    response: string
    campaignName: string
    respondedAt: string
  }>
  recentActivity: Array<{
    id: string
    type: 'booking' | 'response' | 'opt_out' | 'campaign_started'
    message: string
    timestamp: string
  }>
}

export default function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for now - replace with real API call
    setTimeout(() => {
      setData({
        metrics: {
          totalRevenue: 12450,
          revenueChange: 23.5,
          totalBookings: 47,
          bookingsChange: 15.2,
          activeLeads: 234,
          leadsChange: -5.3,
          responseRate: 8.4,
          responseRateChange: 2.1,
        },
        activeCampaigns: [
          { id: '1', name: 'January Reactivation', progress: 43, hotLeads: 3, status: 'active' },
          { id: '2', name: 'VIP Follow-up', progress: 78, hotLeads: 1, status: 'active' },
        ],
        hotLeads: [
          {
            id: '1',
            name: 'Sarah Johnson',
            phone: '+1 (555) 123-4567',
            response: 'Yes! I\'d love to book for Friday',
            campaignName: 'January Reactivation',
            respondedAt: '2 hours ago',
          },
          {
            id: '2',
            name: 'Michelle Davis',
            phone: '+1 (555) 234-5678',
            response: 'Is tomorrow at 2pm available?',
            campaignName: 'January Reactivation',
            respondedAt: '4 hours ago',
          },
          {
            id: '3',
            name: 'Ashley Williams',
            phone: '+1 (555) 345-6789',
            response: 'Sure, what times do you have?',
            campaignName: 'VIP Follow-up',
            respondedAt: '1 day ago',
          },
        ],
        recentActivity: [
          { id: '1', type: 'booking', message: 'Sarah Johnson booked for Jan 15', timestamp: '1 hour ago' },
          { id: '2', type: 'response', message: 'New response from Michelle Davis', timestamp: '4 hours ago' },
          { id: '3', type: 'campaign_started', message: 'VIP Follow-up campaign started', timestamp: '1 day ago' },
          { id: '4', type: 'opt_out', message: 'Jennifer Brown opted out', timestamp: '1 day ago' },
          { id: '5', type: 'booking', message: 'Lisa Anderson booked for Jan 18', timestamp: '2 days ago' },
        ],
      })
      setLoading(false)
    }, 500)
  }, [])

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-400">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-400">Welcome back! Here's your revenue snapshot.</p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition"
        >
          <Plus className="w-5 h-5" />
          New Campaign
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Total Revenue"
          value={`$${data.metrics.totalRevenue.toLocaleString()}`}
          change={data.metrics.revenueChange}
          icon={<DollarSign className="w-5 h-5" />}
          color="emerald"
        />
        <MetricCard
          label="Bookings"
          value={data.metrics.totalBookings}
          change={data.metrics.bookingsChange}
          icon={<Calendar className="w-5 h-5" />}
          color="cyan"
        />
        <MetricCard
          label="Active Leads"
          value={data.metrics.activeLeads}
          change={data.metrics.leadsChange}
          icon={<Users className="w-5 h-5" />}
          color="purple"
        />
        <MetricCard
          label="Response Rate"
          value={`${data.metrics.responseRate}%`}
          change={data.metrics.responseRateChange}
          icon={<Target className="w-5 h-5" />}
          color="blue"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Hot Leads - Priority */}
        <div className="lg:col-span-2">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <h2 className="font-semibold text-white">Hot Leads</h2>
                <span className="text-xs bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full">
                  {data.hotLeads.length} ready to book
                </span>
              </div>
              <Link
                href="/dashboard/hot-leads"
                className="text-sm text-zinc-400 hover:text-white flex items-center gap-1"
              >
                View all
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-zinc-800">
              {data.hotLeads.map((lead) => (
                <div key={lead.id} className="p-4 hover:bg-zinc-800/50 transition">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-white">{lead.name}</p>
                      <p className="text-sm text-zinc-400">{lead.phone}</p>
                    </div>
                    <a
                      href={`tel:${lead.phone}`}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition"
                    >
                      <Phone className="w-4 h-4" />
                      Call
                    </a>
                  </div>
                  <p className="text-sm text-zinc-300 bg-zinc-800 rounded-lg p-2 mb-2">
                    "{lead.response}"
                  </p>
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{lead.campaignName}</span>
                    <span>{lead.respondedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Active Campaigns */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <h2 className="font-semibold text-white">Active Campaigns</h2>
              </div>
              <Link
                href="/dashboard/campaigns"
                className="text-sm text-zinc-400 hover:text-white flex items-center gap-1"
              >
                View all
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-zinc-800">
              {data.activeCampaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/dashboard/campaigns/${campaign.id}`}
                  className="block p-4 hover:bg-zinc-800/50 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-white">{campaign.name}</p>
                    {campaign.hotLeads > 0 && (
                      <span className="text-xs bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded">
                        {campaign.hotLeads} hot
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${campaign.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-500">{campaign.progress}%</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800">
              <h2 className="font-semibold text-white">Recent Activity</h2>
            </div>
            <div className="divide-y divide-zinc-800 max-h-[300px] overflow-y-auto">
              {data.recentActivity.map((activity) => (
                <div key={activity.id} className="px-4 py-3 flex items-start gap-3">
                  <ActivityIcon type={activity.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300">{activity.message}</p>
                    <p className="text-xs text-zinc-500">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

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
        <div
          className={`flex items-center gap-1 text-sm ${
            isPositive ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {isPositive ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}
          {Math.abs(change)}%
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-zinc-500">{label}</p>
    </div>
  )
}

function ActivityIcon({ type }: { type: string }) {
  const config: Record<string, { icon: React.ReactNode; bg: string }> = {
    booking: {
      icon: <Calendar className="w-3 h-3" />,
      bg: 'bg-emerald-500/10 text-emerald-400',
    },
    response: {
      icon: <MessageSquare className="w-3 h-3" />,
      bg: 'bg-blue-500/10 text-blue-400',
    },
    opt_out: {
      icon: <Users className="w-3 h-3" />,
      bg: 'bg-red-500/10 text-red-400',
    },
    campaign_started: {
      icon: <Zap className="w-3 h-3" />,
      bg: 'bg-purple-500/10 text-purple-400',
    },
  }

  const { icon, bg } = config[type] || config.response

  return <div className={`p-1.5 rounded ${bg}`}>{icon}</div>
}
