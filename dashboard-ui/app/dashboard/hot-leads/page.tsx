// =============================================================================
// HOT LEADS PAGE
// /app/dashboard/hot-leads/page.tsx
// Dedicated view for all hot leads across campaigns - the money page
// =============================================================================

'use client'

import { useEffect, useState } from 'react'
import {
  Flame,
  Phone,
  MessageSquare,
  Calendar,
  CheckCircle,
  Clock,
  Filter,
  Search,
  RefreshCw,
  ArrowRight,
  User,
  Sparkles,
} from 'lucide-react'

interface HotLead {
  id: string
  name: string
  phone: string
  email: string | null
  response: string
  extractedIntent: string | null
  campaignId: string
  campaignName: string
  segment: 'ghost' | 'near_miss' | 'vip'
  respondedAt: string
  status: 'new' | 'contacted' | 'booked' | 'no_show'
  notes: string | null
}

export default function HotLeadsPage() {
  const [leads, setLeads] = useState<HotLead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedLead, setSelectedLead] = useState<HotLead | null>(null)

  useEffect(() => {
    // Mock data - replace with real API call
    setTimeout(() => {
      setLeads([
        {
          id: '1',
          name: 'Sarah Johnson',
          phone: '+15551234567',
          email: 'sarah@email.com',
          response: 'Yes! I\'d love to book for Friday. Do you have afternoon slots?',
          extractedIntent: 'Friday afternoon',
          campaignId: 'c1',
          campaignName: 'January Reactivation',
          segment: 'ghost',
          respondedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'new',
          notes: null,
        },
        {
          id: '2',
          name: 'Michelle Davis',
          phone: '+15552345678',
          email: 'michelle@email.com',
          response: 'Is tomorrow at 2pm available?',
          extractedIntent: 'tomorrow 2pm',
          campaignId: 'c1',
          campaignName: 'January Reactivation',
          segment: 'near_miss',
          respondedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          status: 'contacted',
          notes: 'Called, waiting for callback',
        },
        {
          id: '3',
          name: 'Ashley Williams',
          phone: '+15553456789',
          email: null,
          response: 'Sure, what times do you have this week?',
          extractedIntent: 'this week',
          campaignId: 'c2',
          campaignName: 'VIP Follow-up',
          segment: 'vip',
          respondedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          status: 'new',
          notes: null,
        },
        {
          id: '4',
          name: 'Jessica Brown',
          phone: '+15554567890',
          email: 'jess.b@email.com',
          response: 'Yeah I\'ve been meaning to come back! Can I get Saturday morning?',
          extractedIntent: 'Saturday morning',
          campaignId: 'c1',
          campaignName: 'January Reactivation',
          segment: 'ghost',
          respondedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          status: 'booked',
          notes: 'Booked for Saturday Jan 18 at 10am',
        },
        {
          id: '5',
          name: 'Tiffany Moore',
          phone: '+15555678901',
          email: 'tiffany.m@email.com',
          response: 'Yes! I need a touch up ASAP',
          extractedIntent: null,
          campaignId: 'c2',
          campaignName: 'VIP Follow-up',
          segment: 'vip',
          respondedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          status: 'new',
          notes: null,
        },
      ])
      setLoading(false)
    }, 500)
  }, [])

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      lead.response.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Stats
  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === 'new').length,
    contacted: leads.filter((l) => l.status === 'contacted').length,
    booked: leads.filter((l) => l.status === 'booked').length,
  }

  const handleStatusUpdate = (leadId: string, newStatus: HotLead['status']) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    )
    if (selectedLead?.id === leadId) {
      setSelectedLead((prev) => prev ? { ...prev, status: newStatus } : null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Loading hot leads...
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Flame className="w-8 h-8 text-orange-500" />
          <h1 className="text-2xl font-bold text-white">Hot Leads</h1>
        </div>
        <p className="text-zinc-400">
          These people replied positively and are ready to book. Call them now!
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Hot"
          value={stats.total}
          icon={<Flame className="w-5 h-5" />}
          color="orange"
        />
        <StatCard
          label="Need to Call"
          value={stats.new}
          icon={<Phone className="w-5 h-5" />}
          color="red"
          pulse={stats.new > 0}
        />
        <StatCard
          label="Contacted"
          value={stats.contacted}
          icon={<Clock className="w-5 h-5" />}
          color="yellow"
        />
        <StatCard
          label="Booked"
          value={stats.booked}
          icon={<CheckCircle className="w-5 h-5" />}
          color="emerald"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name, phone, or response..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white appearance-none focus:outline-none focus:border-zinc-700 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="new">🔴 New (Call Now!)</option>
            <option value="contacted">🟡 Contacted</option>
            <option value="booked">🟢 Booked</option>
            <option value="no_show">⚫ No Show</option>
          </select>
        </div>
      </div>

      {/* Lead Cards */}
      <div className="grid gap-4">
        {filteredLeads.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900 rounded-xl border border-zinc-800">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-zinc-700" />
            <h3 className="text-lg font-medium text-white mb-2">No hot leads yet</h3>
            <p className="text-zinc-500">
              When someone responds positively to a campaign, they'll appear here
            </p>
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <HotLeadCard
              key={lead.id}
              lead={lead}
              onStatusUpdate={handleStatusUpdate}
              onSelect={() => setSelectedLead(lead)}
            />
          ))
        )}
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  )
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function StatCard({
  label,
  value,
  icon,
  color,
  pulse = false,
}: {
  label: string
  value: number
  icon: React.ReactNode
  color: string
  pulse?: boolean
}) {
  const colorClasses: Record<string, string> = {
    orange: 'text-orange-400 bg-orange-500/10',
    red: 'text-red-400 bg-red-500/10',
    yellow: 'text-yellow-400 bg-yellow-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
  }

  return (
    <div className={`bg-zinc-900 rounded-xl border border-zinc-800 p-4 ${pulse ? 'animate-pulse' : ''}`}>
      <div className={`inline-flex p-2 rounded-lg mb-2 ${colorClasses[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-zinc-500">{label}</p>
    </div>
  )
}

function HotLeadCard({
  lead,
  onStatusUpdate,
  onSelect,
}: {
  lead: HotLead
  onStatusUpdate: (id: string, status: HotLead['status']) => void
  onSelect: () => void
}) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    new: { bg: 'bg-red-500/10', text: 'text-red-400', label: '🔴 Call Now!' },
    contacted: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: '🟡 Contacted' },
    booked: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: '🟢 Booked' },
    no_show: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', label: '⚫ No Show' },
  }

  const segmentLabels: Record<string, string> = {
    ghost: 'Ghost',
    near_miss: 'Near-Miss',
    vip: 'VIP',
  }

  const { bg, text, label } = statusConfig[lead.status]

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
    }
    return phone
  }

  return (
    <div className={`bg-zinc-900 rounded-xl border border-zinc-800 p-5 ${lead.status === 'new' ? 'border-red-500/30' : ''}`}>
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        {/* Lead Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-white">{lead.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${bg} ${text}`}>
                  {label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <span>{formatPhone(lead.phone)}</span>
                <span>•</span>
                <span>{segmentLabels[lead.segment]}</span>
                <span>•</span>
                <span>{lead.campaignName}</span>
              </div>
            </div>
          </div>

          {/* Response */}
          <div className="bg-zinc-800/50 rounded-lg p-3 mb-3">
            <p className="text-sm text-zinc-300">"{lead.response}"</p>
          </div>

          {/* Extracted Intent */}
          {lead.extractedIntent && (
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400">
                Mentioned: {lead.extractedIntent}
              </span>
            </div>
          )}

          {/* Notes */}
          {lead.notes && (
            <p className="text-sm text-zinc-500 italic mb-3">Note: {lead.notes}</p>
          )}

          <p className="text-xs text-zinc-500">
            Responded {formatTimeAgo(lead.respondedAt)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex lg:flex-col gap-2">
          <a
            href={`tel:${lead.phone}`}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition"
          >
            <Phone className="w-4 h-4" />
            Call
          </a>
          <a
            href={`sms:${lead.phone}`}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg font-medium hover:bg-zinc-700 transition"
          >
            <MessageSquare className="w-4 h-4" />
            Text
          </a>
          <button
            onClick={onSelect}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-zinc-700 text-zinc-300 rounded-lg font-medium hover:bg-zinc-800 transition"
          >
            <User className="w-4 h-4" />
            Details
          </button>
        </div>
      </div>

      {/* Quick Status Buttons */}
      {lead.status !== 'booked' && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-800">
          <span className="text-sm text-zinc-500 mr-2">Mark as:</span>
          {lead.status !== 'contacted' && (
            <button
              onClick={() => onStatusUpdate(lead.id, 'contacted')}
              className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded hover:bg-yellow-500/20 transition"
            >
              Contacted
            </button>
          )}
          <button
            onClick={() => onStatusUpdate(lead.id, 'booked')}
            className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded hover:bg-emerald-500/20 transition"
          >
            Booked ✓
          </button>
          <button
            onClick={() => onStatusUpdate(lead.id, 'no_show')}
            className="text-xs px-2 py-1 bg-zinc-500/10 text-zinc-400 rounded hover:bg-zinc-500/20 transition"
          >
            No Show
          </button>
        </div>
      )}
    </div>
  )
}

function LeadDetailModal({
  lead,
  onClose,
  onStatusUpdate,
}: {
  lead: HotLead
  onClose: () => void
  onStatusUpdate: (id: string, status: HotLead['status']) => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">{lead.name}</h2>
              <p className="text-zinc-400">{lead.campaignName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-500">Phone</label>
              <p className="text-white">{lead.phone}</p>
            </div>
            {lead.email && (
              <div>
                <label className="text-sm text-zinc-500">Email</label>
                <p className="text-white">{lead.email}</p>
              </div>
            )}
            <div>
              <label className="text-sm text-zinc-500">Response</label>
              <p className="text-white bg-zinc-800 rounded-lg p-3 mt-1">
                "{lead.response}"
              </p>
            </div>
            {lead.extractedIntent && (
              <div>
                <label className="text-sm text-zinc-500">Booking Intent</label>
                <p className="text-cyan-400">{lead.extractedIntent}</p>
              </div>
            )}
            <div>
              <label className="text-sm text-zinc-500">Segment</label>
              <p className="text-white capitalize">{lead.segment.replace('_', '-')}</p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <a
              href={`tel:${lead.phone}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition"
            >
              <Phone className="w-5 h-5" />
              Call Now
            </a>
            <a
              href={`sms:${lead.phone}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 text-white rounded-lg font-medium hover:bg-zinc-700 transition"
            >
              <MessageSquare className="w-5 h-5" />
              Send Text
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 172800) return 'yesterday'
  return `${Math.floor(seconds / 86400)}d ago`
}
