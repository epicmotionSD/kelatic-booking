'use client';

import { useState } from 'react';
import { Loader2, Play, Send } from 'lucide-react';
import QuickGenerate from './quick-generate';

export type ActionKind =
  | 'generate-content'
  | 'generate-campaign'
  | 'find-gaps'
  | 'ghost-clients'
  | 'view-tickets'
  | 'knowledge-search'
  | 'support-chat';

interface Props {
  action: ActionKind;
  endpoint?: string;
  businessId: string | null;
  color: string;
}

// Dispatcher: routes each runnable tool to the right inline UI.
export default function AgentAction({ action, endpoint, businessId, color }: Props) {
  if (action === 'generate-content' || action === 'generate-campaign') {
    return <QuickGenerate action={action} businessId={businessId} color={color} />;
  }

  if (!businessId) {
    return (
      <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-sm text-gray-500">Connect a business to run this action.</p>
      </div>
    );
  }

  if (action === 'support-chat') {
    return <SupportChat endpoint={endpoint || ''} businessId={businessId} color={color} />;
  }
  if (action === 'knowledge-search') {
    return <KnowledgeSearch endpoint={endpoint || ''} businessId={businessId} color={color} />;
  }
  return <FetchView action={action} endpoint={endpoint || ''} businessId={businessId} color={color} />;
}

// ── Helpers ───────────────────────────────────────────────────────────────
function firstArray(data: unknown): unknown[] | null {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    for (const v of Object.values(data as Record<string, unknown>)) {
      if (Array.isArray(v)) return v;
    }
  }
  return null;
}

function itemLabel(item: unknown): string {
  if (item == null) return '';
  if (typeof item === 'string' || typeof item === 'number') return String(item);
  if (typeof item === 'object') {
    const o = item as Record<string, unknown>;
    const name =
      o.name || o.title || o.subject || o.full_name ||
      [o.first_name, o.last_name].filter(Boolean).join(' ') || o.email || o.id;
    const extra = o.date || o.start || o.status || o.days_since || o.last_visit;
    return [name, extra].filter(Boolean).join(' · ') || JSON.stringify(o);
  }
  return String(item);
}

function ResultView({ data }: { data: unknown }) {
  const items = firstArray(data);
  return (
    <div className="mt-3">
      {items ? (
        <>
          <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">{items.length} results</div>
          {items.length > 0 ? (
            <ul className="divide-y divide-gray-100 bg-white border border-gray-200 rounded-lg max-h-64 overflow-auto">
              {items.slice(0, 50).map((it, i) => (
                <li key={i} className="px-3 py-2 text-sm text-gray-700">{itemLabel(it)}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Nothing found.</p>
          )}
        </>
      ) : (
        <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-white border border-gray-200 rounded-lg p-3 max-h-64 overflow-auto">
          {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

function useRunner() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<unknown>(null);

  async function call(url: string, init?: RequestInit) {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(url, init);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Request failed.');
        return;
      }
      setData(json);
    } catch (e) {
      console.error(e);
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, data, call };
}

function RunButton({ loading, color, label, onClick }: { loading: boolean; color: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 text-white text-sm font-medium rounded-lg px-3 py-2 disabled:opacity-50"
      style={{ backgroundColor: color }}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
      {label}
    </button>
  );
}

// ── Fetch & view (ghost-clients, find-gaps, view-tickets) ──────────────────
function FetchView({
  action,
  endpoint,
  businessId,
  color,
}: {
  action: 'find-gaps' | 'ghost-clients' | 'view-tickets';
  endpoint: string;
  businessId: string;
  color: string;
}) {
  const { loading, error, data, call } = useRunner();
  const today = new Date().toISOString().slice(0, 10);
  const in14 = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
  const [minDays, setMinDays] = useState('45');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(in14);

  function run() {
    const p = new URLSearchParams({ businessId });
    if (action === 'ghost-clients') p.set('minDays', minDays);
    if (action === 'find-gaps') {
      p.set('startDate', startDate);
      p.set('endDate', endDate);
      p.set('analyze', 'true');
    }
    call(`${endpoint}?${p.toString()}`);
  }

  return (
    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
      <div className="flex flex-wrap items-end gap-2">
        {action === 'ghost-clients' && (
          <label className="text-sm text-gray-600">
            Inactive for ≥
            <input value={minDays} onChange={(e) => setMinDays(e.target.value)} inputMode="numeric"
              className="mx-1 w-16 border border-gray-300 rounded px-2 py-1 text-sm" /> days
          </label>
        )}
        {action === 'find-gaps' && (
          <>
            <label className="text-sm text-gray-600">From
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="ml-1 border border-gray-300 rounded px-2 py-1 text-sm" />
            </label>
            <label className="text-sm text-gray-600">to
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="ml-1 border border-gray-300 rounded px-2 py-1 text-sm" />
            </label>
          </>
        )}
        <RunButton loading={loading} color={color}
          label={action === 'ghost-clients' ? 'Find ghost clients' : action === 'find-gaps' ? 'Find gaps' : 'Load tickets'}
          onClick={run} />
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      {data != null && <ResultView data={data} />}
    </div>
  );
}

// ── Knowledge search ───────────────────────────────────────────────────────
function KnowledgeSearch({ endpoint, businessId, color }: { endpoint: string; businessId: string; color: string }) {
  const { loading, error, data, call } = useRunner();
  const [query, setQuery] = useState('');

  function run() {
    if (!query.trim()) return;
    const p = new URLSearchParams({ businessId, query: query.trim() });
    call(`${endpoint}?${p.toString()}`);
  }

  return (
    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
      <div className="flex gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') run(); }}
          placeholder="Search the knowledge base…"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <RunButton loading={loading} color={color} label="Search" onClick={run} />
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      {data != null && <ResultView data={data} />}
    </div>
  );
}

// ── Support chat ───────────────────────────────────────────────────────────
function SupportChat({ endpoint, businessId, color }: { endpoint: string; businessId: string; color: string }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState<string>('');

  async function send() {
    if (!message.trim()) return;
    setLoading(true);
    setError(null);
    setReply('');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Request failed.');
        return;
      }
      const text =
        data.response || data.reply || data.message ||
        (typeof data.content === 'string' ? data.content : null) ||
        JSON.stringify(data, null, 2);
      setReply(text);
    } catch (e) {
      console.error(e);
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
      <div className="flex gap-2">
        <input value={message} onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder="Ask the support agent a client question…"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <button onClick={send} disabled={loading}
          className="inline-flex items-center gap-2 text-white text-sm font-medium rounded-lg px-3 py-2 disabled:opacity-50"
          style={{ backgroundColor: color }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Ask
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      {reply && (
        <pre className="mt-3 whitespace-pre-wrap text-sm text-gray-800 bg-white border border-gray-200 rounded-lg p-3 max-h-64 overflow-auto">
          {reply}
        </pre>
      )}
    </div>
  );
}
