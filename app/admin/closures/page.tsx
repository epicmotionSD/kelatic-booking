'use client';

import { useEffect, useState } from 'react';
import { CalendarOff, Plus, Trash2, X } from 'lucide-react';

interface Closure {
  id: string;
  start_datetime: string;
  end_datetime: string;
  reason: string;
  created_at?: string;
}

function fmtRange(startIso: string, endIso: string, timeZone: string) {
  const start = new Date(startIso);
  // end is the EXCLUSIVE upper bound (midnight of the day after). Subtract 1ms
  // so we display the last day of the closure, not the day after.
  const lastDay = new Date(new Date(endIso).getTime() - 1);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', {
      timeZone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  const startLabel = fmt(start);
  const endLabel = fmt(lastDay);
  return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
}

function todayInTz(timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export default function ClosuresPage() {
  const [closures, setClosures] = useState<Closure[]>([]);
  const [timezone, setTimezone] = useState('America/Chicago');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/closures', { cache: 'no-store' });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setClosures(data.closures || []);
      if (data.timezone) setTimezone(data.timezone);
    } catch (e: any) {
      setError(e.message || 'Failed to load closures');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Remove this closure? Bookings will be possible on those dates again.')) return;
    const res = await fetch(`/api/admin/closures/${id}`, { method: 'DELETE' });
    if (res.ok) {
      load();
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error || 'Failed to delete closure');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarOff className="w-6 h-6 text-amber-400" />
            Shop Closures
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Block off holidays or any day the shop is closed. New bookings can&apos;t be made
            on these dates; existing appointments aren&apos;t touched.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-amber-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Closure
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-zinc-900">
        {loading ? (
          <div className="p-6 text-sm text-white/40">Loading…</div>
        ) : closures.length === 0 ? (
          <div className="p-6 text-sm text-white/40">
            No upcoming closures. The shop is open every day per the regular weekly schedule.
          </div>
        ) : (
          <ul className="divide-y divide-white/10">
            {closures.map((c) => (
              <li key={c.id} className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-white font-medium">{fmtRange(c.start_datetime, c.end_datetime, timezone)}</p>
                  <p className="text-sm text-white/60 mt-0.5">{c.reason}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  className="shrink-0 p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Remove closure"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-white/30">
        All dates are interpreted in the shop&apos;s timezone ({timezone}).
      </p>

      {modalOpen && (
        <ClosureModal
          timezone={timezone}
          onClose={() => setModalOpen(false)}
          onSave={() => {
            setModalOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}

interface ModalProps {
  timezone: string;
  onClose: () => void;
  onSave: () => void;
}

function ClosureModal({ timezone, onClose, onSave }: ModalProps) {
  const today = todayInTz(timezone);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError('Please add a reason (e.g. "Christmas Day" or "Stylist meeting").');
      return;
    }
    if (endDate < startDate) {
      setError('End date can’t be before start date.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/closures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate,
          reason: reason.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      onSave();
    } catch (e: any) {
      setError(e.message || 'Failed to save closure');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Add Closure</h2>
          <button type="button" onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="closure-start" className="block text-xs uppercase tracking-wider text-white/50 font-semibold mb-1">
                Start date
              </label>
              <input
                id="closure-start"
                type="date"
                value={startDate}
                min={today}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate < e.target.value) setEndDate(e.target.value);
                }}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                required
              />
            </div>
            <div>
              <label htmlFor="closure-end" className="block text-xs uppercase tracking-wider text-white/50 font-semibold mb-1">
                End date
              </label>
              <input
                id="closure-end"
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="closure-reason" className="block text-xs uppercase tracking-wider text-white/50 font-semibold mb-1">
              Reason
            </label>
            <input
              id="closure-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Christmas Day, Stylist meeting, Maintenance"
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          <p className="text-xs text-white/40">
            Block runs from 12:00 AM on the start date to 11:59 PM on the end date,
            shop time ({timezone}).
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Closure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
