'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/currency';
import {
  ShoppingBag,
  DollarSign,
  Clock,
  Package,
  Plus,
  CreditCard,
  ArrowRight,
} from 'lucide-react';
import type { Order } from '@/types/commerce';

interface Summary {
  today_orders: number;
  today_revenue_cents: number;
  open_count: number;
}

export default function CommerceDashboard() {
  const [summary, setSummary] = useState<Summary>({
    today_orders: 0,
    today_revenue_cents: 0,
    open_count: 0,
  });
  const [recent, setRecent] = useState<Order[]>([]);
  const [productCount, setProductCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [oRes, pRes] = await Promise.all([
          fetch('/api/admin/orders'),
          fetch('/api/admin/products'),
        ]);
        const oData = await oRes.json();
        const pData = await pRes.json();
        setSummary(oData.summary || summary);
        setRecent((oData.orders || []).slice(0, 6));
        setProductCount((pData.products || []).length);
      } catch (e) {
        console.error('Dashboard load failed', e);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-gray-50 rounded-2xl p-6 min-h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Kelatic Vitality House — today at a glance.</p>
      </div>

      {/* Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Tile icon={<ShoppingBag className="w-5 h-5" />} label="Orders today" value={String(summary.today_orders)} />
        <Tile icon={<DollarSign className="w-5 h-5" />} label="Revenue today" value={formatCurrency(summary.today_revenue_cents)} />
        <Tile icon={<Clock className="w-5 h-5" />} label="Open now" value={String(summary.open_count)} />
        <Tile icon={<Package className="w-5 h-5" />} label="Products" value={String(productCount)} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <QuickAction href="/admin/register" icon={<CreditCard className="w-5 h-5" />} label="Open Register" sub="Ring up a sale" />
        <QuickAction href="/admin/products" icon={<Plus className="w-5 h-5" />} label="Add Product" sub="New menu item" />
        <QuickAction href="/admin/orders" icon={<ShoppingBag className="w-5 h-5" />} label="View Orders" sub="Live queue" />
      </div>

      {/* Recent orders */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm text-emerald-700 flex items-center gap-1">
            All orders <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {loading ? (
          <p className="text-gray-400 text-sm py-6 text-center">Loading…</p>
        ) : recent.length === 0 ? (
          <p className="text-gray-400 text-sm py-6 text-center">No orders yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recent.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <span className="text-sm font-medium text-gray-900">{o.customer_name || 'Guest'}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{o.status}</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(o.total_cents)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Tile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="text-gray-400 mb-1">{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
  sub,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 bg-white border border-gray-200 hover:border-emerald-400 rounded-xl p-4 transition-colors"
    >
      <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="font-semibold text-gray-900 text-sm">{label}</div>
        <div className="text-xs text-gray-500">{sub}</div>
      </div>
    </Link>
  );
}
