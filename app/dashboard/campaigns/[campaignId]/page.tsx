// =============================================================================
// CAMPAIGN DASHBOARD PAGE
// /app/dashboard/campaigns/[campaignId]/page.tsx
// Shows real-time campaign progress, hot leads, and activity feed
// =============================================================================

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  TrendingUp,
  Users,
  DollarSign,
  Pause,
  Play,
  XCircle,
  RefreshCw,
  Flame,
  CheckCircle,
  XOctagon,
  Clock,
  Zap,
} from 'lucide-react'

// Types matching the API response
interface CampaignDashboardData {
  campaign: {
    id: string
    name: string
    status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled'
    segment: 'ghost' | 'near_miss' | 'vip'
    scriptVariant: string
    startedAt: string | null
    completedAt: string | null
    business: {
      id: string
      name: string
    }
  }
  metrics: {
    sent: number
    delivered: number
    failed: number
    responses: number
    positive_responses: number
    negative_responses: number
    opt_outs: number
    bookings: number
    revenue: number
    smsCost: number
    roi: number
  }
  leads: {
    total: number
    pending: number
    inProgress: number
    responded: number
    booked: number
    optedOut: number
    completed: number
    positive: number
    negative: number
  }
  progress: {
    currentDay: number
    totalDays: number
    percentComplete: number
    estimatedCompletion: string | null
  }
  hotLeads: Array<{
    id: string
    name: string
    phone: string
    respondedAt: string
    response: string
    extractedIntent: string | null
  }>
  recentActivity: Array<{
    id: string
    direction: 'inbound' | 'outbound'
    body: string
    status: string
    sentiment: string | null
    isHot: boolean
    leadName: string
    timestamp: string
  }>
}

export default function CampaignDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.campaignId as string

  const [data, setData] = useState<CampaignDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Fetch campaign data
  const fetchData = async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`)
      if (!res.ok) throw new Error('Failed to fetch campaign')
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch + polling every 10 seconds
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [campaignId])

  // Handle campaign actions
  const handleAction = async (action: 'pause' | 'resume' | 'cancel') => {
    if (!confirm(`Are you sure you want to ${action} this campaign?`)) return

    setActionLoading(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error('Action failed')
      await fetchData()
    } catch (err) {
      alert(`Failed to ${action} campaign`)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading campaign...</span>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Campaign not found'}</p>
          <button
            onClick={() => router.push('/dashboard/campaigns')}
            className="text-emerald-400 hover:underline"
          >
            Back to campaigns
          </button>
        </div>
      </div>
    )
  }

  const { campaign, metrics, leads, progress, hotLeads, recentActivity } = data

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard/campaigns')}
                className="p-2 hover:bg-zinc-800 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold">{campaign.name}</h1>
                <p className="text-sm text-zinc-400">{campaign.business.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Status Badge */}
              <StatusBadge status={campaign.status} />

              {/* Action Buttons */}
              {campaign.status === 'active' && (
                <button
                  onClick={() => handleAction('pause')}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition"
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </button>
              )}
              {campaign.status === 'paused' && (
                <button
                  onClick={() => handleAction('resume')}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition"
                >
                  <Play className="w-4 h-4" />
                  Resume
                </button>
              )}
              {['active', 'paused'].includes(campaign.status) && (
                <button
                  onClick={() => handleAction('cancel')}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel
                </button>
              )}

              {/* Refresh */}
              <button
                onClick={fetchData}
                className="p-2 hover:bg-zinc-800 rounded-lg transition"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">
              Day {progress.currentDay} of {progress.totalDays}
            </span>
            <span className="text-sm text-zinc-400">
              {progress.percentComplete}% complete
            </span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${progress.percentComplete}%` }}
            />
          </div>
          {progress.estimatedCompletion && (
            <p className="text-xs text-zinc-500 mt-1">
              Estimated completion: {new Date(progress.estimatedCompletion).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <MetricCard
            label="Sent"
            value={metrics.sent}
            icon={<MessageSquare className="w-5 h-5" />}
            color="blue"
          />
          <MetricCard
            label="Delivered"
            value={metrics.delivered}
            icon={<CheckCircle className="w-5 h-5" />}
            color="green"
          />
          <MetricCard
            label="Responses"
            value={metrics.responses}
            icon={<Users className="w-5 h-5" />}
            color="purple"
          />
          <MetricCard
            label="Bookings"
            value={metrics.bookings}
            icon={<Zap className="w-5 h-5" />}
            color="emerald"
          />
          <MetricCard
            label="Revenue"
            value={`$${metrics.revenue.toLocaleString()}`}
            icon={<DollarSign className="w-5 h-5" />}
            color="cyan"
          />
          <MetricCard
            label="ROI"
            value={`${metrics.roi}%`}
            icon={<TrendingUp className="w-5 h-5" />}
            color={metrics.roi > 0 ? 'emerald' : 'red'}
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Hot Leads - Takes 1 column */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <h2 className="font-semibold">Hot Leads</h2>
                </div>
                <span className="text-xs bg-orange-500/10 text-orange-400 px-2 py-1 rounded-full">
                  {hotLeads.length} ready
                </span>
              </div>

              <div className="divide-y divide-zinc-800 max-h-[500px] overflow-y-auto">
                {hotLeads.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500">
                    <Flame className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No hot leads yet</p>
                    <p className="text-xs mt-1">They'll appear here when someone responds positively</p>
                  </div>
                ) : (
                  hotLeads.map((lead) => (
                    <HotLeadCard key={lead.id} lead={lead} />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Activity Feed - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  <h2 className="font-semibold">Activity Feed</h2>
                </div>
                <span className="text-xs text-zinc-500">
                  Auto-refreshes every 10s
                </span>
              </div>

              <div className="divide-y divide-zinc-800 max-h-[500px] overflow-y-auto">
                {recentActivity.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No activity yet</p>
                    <p className="text-xs mt-1">Messages will appear here as they're sent and received</p>
                  </div>
                ) : (
                  recentActivity.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lead Breakdown */}
        <div className="mt-8">
          <h2 className="font-semibold mb-4">Lead Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <LeadStatCard label="Total" value={leads.total} />
            <LeadStatCard label="Pending" value={leads.pending} color="zinc" />
            <LeadStatCard label="In Progress" value={leads.inProgress} color="blue" />
            <LeadStatCard label="Responded" value={leads.responded} color="purple" />
            <LeadStatCard label="Booked" value={leads.booked} color="emerald" />
            <LeadStatCard label="Opted Out" value={leads.optedOut} color="red" />
            <LeadStatCard label="Completed" value={leads.completed} color="zinc" />
          </div>
        </div>
      </main>
    </div>
  )
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', label: 'Draft' },
    scheduled: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Scheduled' },
    active: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Active' },
    paused: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'Paused' },
    completed: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', label: 'Completed' },
    cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Cancelled' },
  }

  const { bg, text, label } = config[status] || config.draft

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${bg} ${text}`}>
      {label}
    </span>
  )
}

function MetricCard({
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
    green: 'text-green-400 bg-green-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    cyan: 'text-cyan-400 bg-cyan-500/10',
    red: 'text-red-400 bg-red-500/10',
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

function HotLeadCard({ lead }: { lead: CampaignDashboardData['hotLeads'][0] }) {
  const handleCall = () => {
    window.open(`tel:${lead.phone}`, '_self')
  }

  return (
    <div className="p-4 hover:bg-zinc-800/50 transition">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-medium">{lead.name || 'Unknown'}</p>
          <p className="text-sm text-zinc-400">{formatPhone(lead.phone)}</p>
        </div>
        <button
          onClick={handleCall}
          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition"
        >
          <Phone className="w-4 h-4" />
          Call
        </button>
      </div>
      <p className="text-sm text-zinc-300 bg-zinc-800 rounded-lg p-2 mb-2">
        "{lead.response}"
      </p>
      {lead.extractedIntent && (
        <p className="text-xs text-cyan-400">
          📅 Mentioned: {lead.extractedIntent}
        </p>
      )}
      <p className="text-xs text-zinc-500 mt-1">
        {formatTimeAgo(lead.respondedAt)}
      </p>
    </div>
  )
}

function ActivityItem({ activity }: { activity: CampaignDashboardData['recentActivity'][0] }) {
  const isInbound = activity.direction === 'inbound'

  return (
    <div className={`p-4 ${activity.isHot ? 'bg-orange-500/5' : ''}`}>
      <div className="flex items-start gap-3">
        <div
          className={`p-2 rounded-full ${
            isInbound
              ? activity.sentiment === 'positive'
                ? 'bg-emerald-500/10 text-emerald-400'
                : activity.sentiment === 'opt_out'
                ? 'bg-red-500/10 text-red-400'
                : 'bg-blue-500/10 text-blue-400'
              : 'bg-zinc-800 text-zinc-400'
          }`}
        >
          {isInbound ? (
            activity.sentiment === 'opt_out' ? (
              <XOctagon className="w-4 h-4" />
            ) : (
              <MessageSquare className="w-4 h-4" />
            )
          ) : (
            <MessageSquare className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">
              {isInbound ? activity.leadName : 'You'}
            </span>
            {activity.isHot && (
              <span className="text-xs bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded">
                🔥 HOT
              </span>
            )}
            {activity.sentiment === 'opt_out' && (
              <span className="text-xs bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded">
                Opted Out
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-300">{activity.body}</p>
          <p className="text-xs text-zinc-500 mt-1">{formatTimeAgo(activity.timestamp)}</p>
        </div>
      </div>
    </div>
  )
}

function LeadStatCard({
  label,
  value,
  color = 'zinc',
}: {
  label: string
  value: number
  color?: string
}) {
  const colorClasses: Record<string, string> = {
    zinc: 'border-zinc-700',
    blue: 'border-blue-500/30',
    purple: 'border-purple-500/30',
    emerald: 'border-emerald-500/30',
    red: 'border-red-500/30',
  }

  return (
    <div className={`bg-zinc-900 rounded-lg border ${colorClasses[color]} p-3 text-center`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  )
}

// =============================================================================
// HELPERS
// =============================================================================

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  return phone
}

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return date.toLocaleDateString()
}
