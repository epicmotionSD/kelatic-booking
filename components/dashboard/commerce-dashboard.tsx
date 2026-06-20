'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/currency';
import { CreditCard, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import type { Order } from '@/types/commerce';
import { StatTile, Panel, StatusDot } from '@/components/terminal';

interface Summary { today_orders: number; today_revenue_cents: number; open_count: number }

export default function CommerceDashboard() {
  const [summary, setSummary] = useState<Summary>({ today_orders: 0, today_revenue_cents: 0, open_count: 0 });
  const [recent, setRecent] = useState<Order[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [oRes, pRes] = await Promise.all([fetch('/api/admin/orders'), fetch('/api/admin/products')]);
        const oData = await oRes.json();
        const pData = await pRes.json();
        setSummary(oData.summary || { today_orders: 0, today_revenue_cents: 0, open_count: 0 });
        setRecent((oData.orders || []).slice(0, 6));
        setProductCount((pData.products || []).length);
      } catch (e) {
        console.error('Dashboard load failed', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Kelatic Vitality House — today at a glance.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatTile label="Orders today" value={String(summary.today_orders)} />
        <StatTile label="Revenue today" value={formatCurrency(summary.today_revenue_cents)} delta={summary.today_revenue_cents > 0 ? 'up' : undefined} />
        <StatTile label="Open now" value={String(summary.open_count)} />
        <StatTile label="Products" value={String(productCount)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <QuickAction href="/admin/register" icon={<CreditCard className="w-4 h-4" />} label="Open Register" sub="Ring up a sale" />
        <QuickAction href="/admin/products" icon={<Plus className="w-4 h-4" />} label="Add Product" sub="New menu item" />
        <QuickAction href="/admin/orders" icon={<ShoppingBag className="w-4 h-4" />} label="View Orders" sub="Live queue" />
      </div>

      <Panel
        title="Recent orders"
        right={<Link href="/admin/orders" className="inline-flex items-center gap-1 text-xs text-[#00ffb2]">All orders <ArrowRight className="w-3.5 h-3.5" /></Link>}
        bodyClassName="p-0"
      >
        {loading ? (
          <p className="text-muted-foreground text-sm py-6 text-center">Loading…</p>
        ) : recent.length === 0 ? (
          <p className="text-muted-foreground text-sm py-6 text-center">No orders yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((o) => (
              <li key={o.id} className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <StatusDot tone={['paid', 'preparing', 'ready'].includes(o.status) ? 'up' : 'idle'} />
                  <span className="text-sm text-foreground/90 truncate">{o.customer_name || 'Guest'}</span>
                  <span className="text-[11px] text-muted-foreground data-mono">
                    {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="term-label text-muted-foreground">{o.status}</span>
                  <span className="text-sm font-semibold text-foreground data-mono">{formatCurrency(o.total_cents)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function QuickAction({ href, icon, label, sub }: { href: string; icon: React.ReactNode; label: string; sub: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-md border border-border bg-card hover:border-[#00ffb2]/40 p-3 transition-colors">
      <div className="w-9 h-9 rounded bg-[#00ffb2]/15 text-[#00ffb2] flex items-center justify-center">{icon}</div>
      <div>
        <div className="font-medium text-foreground text-sm">{label}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
    </Link>
  );
}
