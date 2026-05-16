'use client'

import { useEffect, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardSummary {
  timezone: string
  counts: { today: number; week: number; month: number }
  revenue: { week: number; month: number }
  upcomingAppointments: Array<{
    id: string
    client_name: string
    service_name: string
    stylist_name: string
    start_time: string
    status: string
    quoted_price: number
  }>
}

interface AmeliaConflict {
  appt_1_id: number
  appt_2_id: number
  stylist: string
  service: string
  slot_1_start: string
  slot_1_end: string
  slot_2_start: string
  slot_2_end: string
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function fmtDateTime(iso: string, timezone: string) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  })
}

function isSameLocalDay(a: Date, b: Date, timezone: string) {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' })
  return fmt.format(a) === fmt.format(b)
}

function overlapMinutes(c: AmeliaConflict) {
  const overlapStart = Math.max(new Date(c.slot_1_start).getTime(), new Date(c.slot_2_start).getTime())
  const overlapEnd = Math.min(new Date(c.slot_1_end).getTime(), new Date(c.slot_2_end).getTime())
  return Math.round((overlapEnd - overlapStart) / 60000)
}

// ─── Conflict panel (Amelia double-booking monitor) ───────────────────────────

function ConflictPanel() {
  const [conflicts, setConflicts] = useState<AmeliaConflict[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/bookings/conflicts')
      .then((r) => r.json())
      .then((d) => {
        setConflicts(d.conflicts ?? [])
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="rounded-[14px] border border-white/10 bg-zinc-900 p-4 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-xs text-white/40 tracking-widest uppercase">Scanning Amelia for conflicts…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-[14px] border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-red-400" />
        <span className="text-xs text-red-400 tracking-widest uppercase">Bluehost MySQL unreachable — check env vars</span>
      </div>
    )
  }

  const count = conflicts.length

  return (
    <div
      className={`rounded-[14px] border p-4 md:p-5 ${
        count === 0 ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${count === 0 ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'}`} />
          <h2 className="text-xs uppercase tracking-[0.12em] font-semibold text-white/40">
            Amelia Double-Booking Monitor
          </h2>
        </div>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
            count === 0
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}
        >
          {count === 0 ? '✓ No Conflicts' : `${count} Conflict${count > 1 ? 's' : ''} Detected`}
        </span>
      </div>

      {count === 0 ? (
        <p className="text-sm text-white/40">All Amelia appointments are clean — no overlapping bookings.</p>
      ) : (
        <div className="space-y-3 mt-2">
          {conflicts.map((c, i) => (
            <div key={i} className="rounded-[10px] border border-red-500/20 bg-zinc-900 p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm font-semibold text-white">{c.stylist}</p>
                  <p className="text-xs text-white/50 mt-0.5">{c.service}</p>
                </div>
                <span className="text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {overlapMinutes(c)} min overlap
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <a
                  href={`https://kelatic.com/hair-lounge/wp-admin/admin.php?page=wpamelia-appointments&id=${c.appt_1_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-amber-400 hover:text-amber-300 border border-amber-500/20 px-2 py-1 rounded-md tracking-widest uppercase transition-colors"
                >
                  Appt #{c.appt_1_id} →
                </a>
                <a
                  href={`https://kelatic.com/hair-lounge/wp-admin/admin.php?page=wpamelia-appointments&id=${c.appt_2_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-amber-400 hover:text-amber-300 border border-amber-500/20 px-2 py-1 rounded-md tracking-widest uppercase transition-colors"
                >
                  Appt #{c.appt_2_id} →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Metric card ──────────────────────────────────────────────────────────────

function MetricCard({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div className="rounded-[12px] border border-white/10 bg-zinc-900 p-5">
      <p className="text-xs uppercase tracking-[0.12em] text-white/40 font-semibold">{label}</p>
      <p className="text-[34px] font-bold mt-2 leading-none text-white">{value}</p>
      {sublabel && <p className="text-xs text-white/50 mt-1">{sublabel}</p>}
    </div>
  )
}

// ─── Upcoming list ────────────────────────────────────────────────────────────

function UpcomingList({
  appointments,
  timezone,
}: {
  appointments: DashboardSummary['upcomingAppointments']
  timezone: string
}) {
  if (appointments.length === 0) {
    return <p className="text-sm text-white/40 px-2">No appointments scheduled in the next 7 days.</p>
  }

  const now = new Date()

  return (
    <ul className="divide-y divide-white/8">
      {appointments.map((apt) => {
        const start = new Date(apt.start_time)
        const today = isSameLocalDay(start, now, timezone)
        return (
          <li key={apt.id} className="py-3 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{apt.client_name}</p>
              <p className="text-xs text-white/50 truncate">
                {apt.service_name} · with {apt.stylist_name}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-sm font-mono ${today ? 'text-amber-400' : 'text-white/70'}`}>
                {fmtDateTime(apt.start_time, timezone)}
              </p>
              <p className="text-xs text-white/40">{fmtMoney(apt.quoted_price)}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function RevenueMigrationDashboard({
  maxWidthClass = 'max-w-[1400px] mx-auto',
}: {
  maxWidthClass?: string
}) {
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || `HTTP ${r.status}`)
        return r.json()
      })
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message || 'Failed to load dashboard')
        setLoading(false)
      })
  }, [])

  return (
    <div className={`p-4 lg:p-8 space-y-6 ${maxWidthClass}`}>
      <div>
        <h1 className="text-[26px] font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
          Bookings Dashboard
        </h1>
        <p className="text-white/50 mt-1 text-sm">Live appointments + revenue from the booking system.</p>
      </div>

      <ConflictPanel />

      {error && (
        <div className="rounded-[14px] border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          Could not load dashboard data: {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Bookings today"
          value={loading ? '—' : String(data?.counts.today ?? 0)}
          sublabel={loading ? 'Loading…' : 'Confirmed appointments'}
        />
        <MetricCard
          label="Bookings this week"
          value={loading ? '—' : String(data?.counts.week ?? 0)}
          sublabel="Week to date"
        />
        <MetricCard
          label="Revenue this week"
          value={loading ? '—' : fmtMoney(data?.revenue.week ?? 0)}
          sublabel="Sum of quoted prices"
        />
        <MetricCard
          label="Revenue this month"
          value={loading ? '—' : fmtMoney(data?.revenue.month ?? 0)}
          sublabel={loading ? '' : `${data?.counts.month ?? 0} bookings month-to-date`}
        />
      </div>

      <section className="rounded-[14px] border border-white/10 bg-zinc-900 p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs uppercase tracking-[0.12em] text-white/40 font-semibold">Upcoming — next 7 days</h2>
          <a
            href="/admin/appointments"
            className="text-xs text-amber-400 hover:text-amber-300 tracking-widest uppercase transition-colors"
          >
            All appointments →
          </a>
        </div>
        {loading ? (
          <p className="text-sm text-white/40 px-2">Loading…</p>
        ) : (
          <UpcomingList appointments={data?.upcomingAppointments ?? []} timezone={data?.timezone ?? 'America/Chicago'} />
        )}
      </section>
    </div>
  )
}
