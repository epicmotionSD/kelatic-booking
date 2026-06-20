'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/currency';
import { ShoppingBag, Clock, DollarSign, ChevronRight } from 'lucide-react';
import type { Order, OrderStatus } from '@/types/commerce';

interface Summary {
  today_orders: number;
  today_revenue_cents: number;
  open_count: number;
}

const STATUS_FLOW: Record<string, { next?: OrderStatus; label: string; color: string }> = {
  paid: { next: 'preparing', label: 'Start Preparing', color: 'bg-blue-100 text-blue-700' },
  preparing: { next: 'ready', label: 'Mark Ready', color: 'bg-amber-100 text-amber-700' },
  ready: { next: 'completed', label: 'Complete', color: 'bg-emerald-100 text-emerald-700' },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-500' },
  pending: { label: 'Awaiting payment', color: 'bg-gray-100 text-gray-500' },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-600' },
  refunded: { label: 'Refunded', color: 'bg-red-50 text-red-600' },
};

const FILTERS: { key: string; label: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'all', label: 'All' },
  { key: 'completed', label: 'Completed' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<Summary>({ today_orders: 0, today_revenue_cents: 0, open_count: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');

  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // light polling for the live queue
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      setOrders(data.orders || []);
      setSummary(data.summary || { today_orders: 0, today_revenue_cents: 0, open_count: 0 });
    } catch (e) {
      console.error('Failed to load orders', e);
    } finally {
      setLoading(false);
    }
  }

  async function advance(o: Order) {
    const flow = STATUS_FLOW[o.status];
    if (!flow?.next) return;
    await fetch(`/api/admin/orders/${o.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: flow.next }),
    });
    load();
  }

  const visible = orders.filter((o) => {
    if (filter === 'all') return true;
    if (filter === 'completed') return o.status === 'completed';
    return ['paid', 'preparing', 'ready'].includes(o.status); // open
  });

  return (
    <div className="bg-gray-50 rounded-2xl p-6 max-w-5xl mx-auto min-h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-emerald-600" /> Orders
        </h1>
        <p className="text-sm text-gray-500">Live order queue and today&apos;s summary.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Tile icon={<ShoppingBag className="w-5 h-5" />} label="Orders today" value={String(summary.today_orders)} />
        <Tile
          icon={<DollarSign className="w-5 h-5" />}
          label="Revenue today"
          value={formatCurrency(summary.today_revenue_cents)}
        />
        <Tile icon={<Clock className="w-5 h-5" />} label="Open now" value={String(summary.open_count)} />
      </div>

      <div className="flex gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm ${
              filter === f.key ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : visible.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No orders here yet.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {visible.map((o) => {
            const flow = STATUS_FLOW[o.status] || STATUS_FLOW.pending;
            return (
              <div key={o.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {o.customer_name || 'Guest'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${flow.color}`}>
                        {o.status}
                      </span>
                      <span className="text-xs text-gray-400 capitalize">{o.fulfillment_type}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      #{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleString()}
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900">{formatCurrency(o.total_cents)}</span>
                </div>

                {o.items && o.items.length > 0 && (
                  <ul className="mt-2 text-sm text-gray-600 space-y-0.5">
                    {o.items.map((it) => (
                      <li key={it.id} className="flex justify-between">
                        <span>
                          {it.quantity}× {it.product_name}
                          {it.selected_options?.length > 0 && (
                            <span className="text-gray-400">
                              {' '}
                              ({it.selected_options.map((s) => s.option).join(', ')})
                            </span>
                          )}
                        </span>
                        <span className="text-gray-400">{formatCurrency(it.line_total_cents)}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {o.notes && <p className="mt-2 text-xs text-gray-500 italic">“{o.notes}”</p>}

                {flow.next && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => advance(o)}
                      className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-3 py-1.5 rounded-lg"
                    >
                      {flow.label} <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Tile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 text-gray-400 mb-1">{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
