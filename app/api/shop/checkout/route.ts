import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/tenant/server';
import { stripe } from '@/lib/stripe';

interface CartLine { product_id: string; quantity: number }

// POST /api/shop/checkout — create an order + Stripe PaymentIntent (online card)
// body: { items: CartLine[], customer: {name,email,phone}, tip_cents?, notes? }
export async function POST(request: NextRequest) {
  let business;
  try {
    business = await requireBusiness();
  } catch {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 });
  }

  const body = await request.json();
  const items: CartLine[] = Array.isArray(body.items) ? body.items : [];
  const customer = body.customer || {};
  const tipCents = Math.max(0, Math.round(body.tip_cents || 0));

  if (items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }
  if (!customer.name || !customer.email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const businessId = business.id;

  // Recompute prices server-side (authoritative)
  const ids = [...new Set(items.map((i) => i.product_id))];
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price_cents, is_active')
    .eq('business_id', businessId)
    .in('id', ids);

  const priceMap = new Map((products || []).filter((p) => p.is_active).map((p) => [p.id, p]));

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
    return NextResponse.json({ error: 'No valid items in cart' }, { status: 400 });
  }

  const total = subtotal + tipCents;

  // Create the order (pending)
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      business_id: businessId,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone || null,
      subtotal_cents: subtotal,
      tip_cents: tipCents,
      total_cents: total,
      status: 'pending',
      fulfillment_type: 'pickup',
      notes: body.notes || null,
    })
    .select()
    .single();

  if (orderErr || !order) {
    console.error('Checkout order error:', orderErr);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }

  await supabase.from('order_items').insert(lineItems.map((li) => ({ ...li, order_id: order.id })));

  // Create the PaymentIntent (online card; metadata.order_id drives fulfillment)
  try {
    const pi = await stripe.paymentIntents.create({
      amount: total,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      receipt_email: customer.email,
      metadata: {
        order_id: order.id,
        business_id: businessId,
        order_type: 'product',
      },
    });

    await supabase
      .from('orders')
      .update({ stripe_payment_intent_id: pi.id })
      .eq('id', order.id);

    return NextResponse.json({
      orderId: order.id,
      clientSecret: pi.client_secret,
      amount: total,
    });
  } catch (err) {
    console.error('Checkout PaymentIntent error:', err);
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
    return NextResponse.json({ error: 'Failed to start payment' }, { status: 500 });
  }
}
