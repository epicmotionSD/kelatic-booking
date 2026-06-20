import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminBusiness, isGuardErr } from '@/lib/commerce/guard';

// GET /api/admin/orders — list tenant orders (newest first) + summary tiles
export async function GET(request: NextRequest) {
  const guard = await requireAdminBusiness();
  if (isGuardErr(guard)) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const supabase = createAdminClient();
  const businessId = guard.business.id;
  const statusFilter = new URL(request.url).searchParams.get('status');

  let query = supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data: orders, error } = await query;
  if (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }

  // Summary tiles — today's paid revenue, open queue, counts
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data: todays } = await supabase
    .from('orders')
    .select('total_cents, status, created_at')
    .eq('business_id', businessId)
    .gte('created_at', startOfDay.toISOString());

  const paidStatuses = ['paid', 'preparing', 'ready', 'completed'];
  const summary = {
    today_orders: todays?.length ?? 0,
    today_revenue_cents: (todays ?? [])
      .filter((o) => paidStatuses.includes(o.status))
      .reduce((sum, o) => sum + (o.total_cents || 0), 0),
    open_count: (orders ?? []).filter((o) =>
      ['paid', 'preparing', 'ready'].includes(o.status)
    ).length,
  };

  return NextResponse.json({ orders, summary });
}
