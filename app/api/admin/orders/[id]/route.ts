import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminBusiness, isGuardErr } from '@/lib/commerce/guard';
import type { OrderStatus } from '@/types/commerce';

const VALID: OrderStatus[] = [
  'pending',
  'paid',
  'preparing',
  'ready',
  'completed',
  'cancelled',
  'refunded',
];

// PATCH /api/admin/orders/[id] — advance order status / notes
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requireAdminBusiness();
  if (isGuardErr(guard)) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = await request.json();
  const update: Record<string, unknown> = {};

  if ('status' in body) {
    if (!VALID.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    update.status = body.status;
  }
  if ('notes' in body) update.notes = body.notes;
  if ('pickup_time' in body) update.pickup_time = body.pickup_time;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: order, error } = await supabase
    .from('orders')
    .update(update)
    .eq('id', id)
    .eq('business_id', guard.business.id)
    .select('*, items:order_items(*)')
    .single();

  if (error || !order) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
  return NextResponse.json({ order });
}
