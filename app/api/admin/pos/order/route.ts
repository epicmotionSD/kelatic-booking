import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminBusiness, isGuardErr } from '@/lib/commerce/guard';
import {
  createTerminalPaymentIntent,
  listTerminalReaders,
  processTerminalPayment,
} from '@/lib/stripe';

interface CartLine { product_id: string; quantity: number }

// POST /api/admin/pos/order — in-store register sale
// body: { items: CartLine[], method: 'cash' | 'card_terminal', tip_cents?, customer_name? }
export async function POST(request: NextRequest) {
  const guard = await requireAdminBusiness();
  if (isGuardErr(guard)) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = await request.json();
  const items: CartLine[] = Array.isArray(body.items) ? body.items : [];
  const method: 'cash' | 'card_terminal' = body.method === 'cash' ? 'cash' : 'card_terminal';
  const tipCents = Math.max(0, Math.round(body.tip_cents || 0));

  if (items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const businessId = guard.business.id;

  // Recompute prices server-side from the catalog (never trust the client)
  const ids = [...new Set(items.map((i) => i.product_id))];
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('id, name, price_cents')
    .eq('business_id', businessId)
    .in('id', ids);

  if (prodErr || !products || products.length === 0) {
    return NextResponse.json({ error: 'Products not found' }, { status: 400 });
  }
  const priceMap = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  const lineItems = items
    .map((i) => {
      const p = priceMap.get(i.product_id);
      if (!p) return null;
      const qty = Math.max(1, Math.round(i.quantity || 1));
      const line = p.price_cents * qty;
      subtotal += line;
      return {
        product_id: p.id,
        product_name: p.name,
        unit_price_cents: p.price_cents,
        quantity: qty,
        line_total_cents: line,
        selected_options: [],
      };
    })
    .filter(Boolean) as Array<Record<string, unknown>>;

  if (lineItems.length === 0) {
    return NextResponse.json({ error: 'No valid items' }, { status: 400 });
  }

  const total = subtotal + tipCents;

  // Create the order (pending until paid)
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      business_id: businessId,
      customer_name: body.customer_name || 'Walk-in',
      subtotal_cents: subtotal,
      tip_cents: tipCents,
      total_cents: total,
      status: method === 'cash' ? 'paid' : 'pending',
      fulfillment_type: 'pickup',
      notes: 'In-store register sale',
    })
    .select()
    .single();

  if (orderErr || !order) {
    console.error('POS order create error:', orderErr);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }

  // Attach line items
  await supabase
    .from('order_items')
    .insert(lineItems.map((li) => ({ ...li, order_id: order.id })));

  // ---- CASH ----
  if (method === 'cash') {
    await supabase.from('payments').insert({
      order_id: order.id,
      business_id: businessId,
      amount: subtotal / 100,
      tip_amount: tipCents / 100,
      total_amount: total / 100,
      status: 'paid',
      method: 'cash',
    });
    return NextResponse.json({ order, paid: true, method: 'cash' });
  }

  // ---- CARD (Stripe Terminal reader) ----
  try {
    const readers = await listTerminalReaders();
    const reader = readers.data?.[0];
    if (!reader) {
      // Roll back order so it doesn't linger as pending
      await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
      return NextResponse.json(
        { error: 'No card reader online. Use Cash or check the terminal.' },
        { status: 409 }
      );
    }

    const pi = await createTerminalPaymentIntent({
      amount: total,
      appointmentId: '',
      metadata: { order_id: order.id, business_id: businessId, tip_amount: String(tipCents) },
    });

    await supabase.from('payments').insert({
      order_id: order.id,
      business_id: businessId,
      amount: subtotal / 100,
      tip_amount: tipCents / 100,
      total_amount: total / 100,
      status: 'pending',
      method: 'card_terminal',
      stripe_payment_intent_id: pi.id,
    });

    await supabase
      .from('orders')
      .update({ stripe_payment_intent_id: pi.id })
      .eq('id', order.id);

    await processTerminalPayment(reader.id, pi.id);

    return NextResponse.json({
      order,
      paid: false,
      method: 'card_terminal',
      paymentIntentId: pi.id,
      readerId: reader.id,
    });
  } catch (err) {
    console.error('POS terminal error:', err);
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
    return NextResponse.json({ error: 'Card terminal failed' }, { status: 500 });
  }
}
