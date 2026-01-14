// =============================================================================
// CAMPAIGNS LIST PAGE
// /app/dashboard/campaigns/page.tsx
// Shows all campaigns with status, metrics, and quick actions
// =============================================================================

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  Flame,
  TrendingUp,
  MessageSquare,
  Users,
  Calendar,
  ChevronRight,
  Zap,
} from 'lucide-react'

interface Campaign {
  id: string
  name: string
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled'
  segment: 'ghost' | 'near_miss' | 'vip'
  totalLeads: number
  metrics: {
    sent: number
    responses: number
    bookings: number
    revenue: number
  }
  progress: {
    currentDay: number
    totalDays: number
    percentComplete: number
  }
  hotLeadCount: number
  startedAt: string | null
  createdAt: string
}

interface CampaignsResponse {
  campaigns: Campaign[]
  summary: {
    total: number
    active: number
    totalRevenue: number
    totalBookings: number
  }
}

export default function CampaignsListPage() {
  const router = useRouter()
  const [data, setData] = useState<CampaignsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
    // Poll every 30 seconds
    const interval = setInterval(fetchCampaigns, 30000)
    return () => clearInterval(interval)
  }, [])

  // Filter campaigns
  const filteredCampaigns = data?.campaigns.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    return matchesSearch && matchesStatus
  }) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading campaigns...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Campaigns</h1>
              <p className="text-sm text-zinc-400">
                Manage your lead reactivation campaigns
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard/campaigns/new')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition"
            >
              <Plus className="w-5 h-5" />
              New Campaign
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        {data?.summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <SummaryCard
              label="Total Campaigns"
              value={data.summary.total}
              icon={<MessageSquare className="w-5 h-5" />}
              color="blue"
            />
            <SummaryCard
              label="Active Now"
              value={data.summary.active}
              icon={<Zap className="w-5 h-5" />}
              color="emerald"
            />
            <SummaryCard
              label="Total Bookings"
              value={data.summary.totalBookings}
              icon={<Users className="w-5 h-5" />}
              color="purple"
            />
            <SummaryCard
              label="Total Revenue"
              value={`$${data.summary.totalRevenue.toLocaleString()}`}
              icon={<TrendingUp className="w-5 h-5" />}
              color="cyan"
            />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white appearance-none focus:outline-none focus:border-zinc-700 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Refresh */}
          <button
            onClick={fetchCampaigns}
            className="p-2 hover:bg-zinc-800 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Campaigns Grid */}
        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-zinc-700" />
            <h3 className="text-lg font-medium mb-2">No campaigns found</h3>
            <p className="text-zinc-500 mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first campaign to start reactivating leads'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <button
                onClick={() => router.push('/dashboard/campaigns/new')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition"
              >
                <Plus className="w-5 h-5" />
                Create Campaign
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
}) {
  const colorClasses: Record<string, string> = {
    blue: 'text-blue-400 bg-blue-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    cyan: 'text-cyan-400 bg-cyan-500/10',
  }

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
      <div className={`inline-flex p-2 rounded-lg mb-2 ${colorClasses[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-zinc-500">{label}</p>
    </div>
  )
}

function CampaignCard({
  campaign,
  onClick,
}: {
  campaign: Campaign
  onClick: () => void
}) {
  const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
    draft: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', dot: 'bg-zinc-400' },
    scheduled: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
    active: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    paused: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400' },
    completed: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', dot: 'bg-cyan-400' },
    cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  }

  const segmentLabels: Record<string, string> = {
    ghost: 'Ghost Leads',
    near_miss: 'Near-Miss',
    vip: 'VIP',
  }

  const { bg, text, dot } = statusConfig[campaign.status] || statusConfig.draft

  return (
    <div
      onClick={onClick}
      className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 hover:border-zinc-700 transition cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-lg font-semibold group-hover:text-emerald-400 transition">
              {campaign.name}
            </h3>
            {campaign.hotLeadCount > 0 && (
              <span className="flex items-center gap-1 text-xs bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full">
                <Flame className="w-3 h-3" />
                {campaign.hotLeadCount} hot
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-400">
            <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${bg} ${text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dot} ${campaign.status === 'active' ? 'animate-pulse' : ''}`} />
              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
            </span>
            <span>{segmentLabels[campaign.segment]}</span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {campaign.totalLeads} leads
            </span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition" />
      </div>

      {/* Progress */}
      {campaign.status === 'active' && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
            <span>Day {campaign.progress.currentDay}/{campaign.progress.totalDays}</span>
            <span>{campaign.progress.percentComplete}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
              style={{ width: `${campaign.progress.percentComplete}%` }}
            />
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4 pt-4 border-t border-zinc-800">
        <div>
          <p className="text-lg font-semibold">{campaign.metrics.sent}</p>
          <p className="text-xs text-zinc-500">Sent</p>
        </div>
        <div>
          <p className="text-lg font-semibold">{campaign.metrics.responses}</p>
          <p className="text-xs text-zinc-500">Responses</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-emerald-400">{campaign.metrics.bookings}</p>
          <p className="text-xs text-zinc-500">Bookings</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-cyan-400">${campaign.metrics.revenue.toLocaleString()}</p>
          <p className="text-xs text-zinc-500">Revenue</p>
        </div>
      </div>

      {/* Date */}
      <div className="flex items-center gap-1 text-xs text-zinc-500 mt-4">
        <Calendar className="w-3 h-3" />
        {campaign.startedAt
          ? `Started ${new Date(campaign.startedAt).toLocaleDateString()}`
          : `Created ${new Date(campaign.createdAt).toLocaleDateString()}`}
      </div>
    </div>
  )
}
