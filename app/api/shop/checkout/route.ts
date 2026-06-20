import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/tenant/server';
import { stripe } from '@/lib/stripe';
import {
  computeRewardDiscount,
  getProgramForBusiness,
} from '@/lib/agents/modules/loyalty';
import { buildConnectRouting } from '@/lib/stripe/connect';

interface CartLine { product_id: string; quantity: number }
interface LoyaltyApply { rewardId: string }

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

  // ─────────────────────────────────────────────────────────────────────
  // Loyalty redemption (optional). Server validates the reward, recomputes
  // the discount, and stamps the PaymentIntent metadata. The actual account
  // debit + ledger row happen in the Stripe webhook after payment succeeds.
  // ─────────────────────────────────────────────────────────────────────
  const apply = body.loyalty as LoyaltyApply | undefined;
  let discountCents = 0;
  let loyaltyClientId: string | null = null;
  let loyaltyRewardId: string | null = null;

  if (apply?.rewardId && customer.email) {
    const program = await getProgramForBusiness(supabase, businessId);
    if (program) {
      const { data: rewardRow } = await supabase
        .from('loyalty_rewards')
        .select(
          'id, name, cost_points, reward_type, service_id, product_id, config, tier_required, is_active, sort_order, description, program_id'
        )
        .eq('id', apply.rewardId)
        .eq('program_id', program.id)
        .eq('is_active', true)
        .maybeSingle();
      const { data: clientRow } = await supabase
        .from('clients')
        .select('id')
        .eq('business_id', businessId)
        .eq('email', String(customer.email).trim().toLowerCase())
        .maybeSingle();
      const { data: account } = clientRow
        ? await supabase
            .from('loyalty_accounts')
            .select('id, balance, current_tier')
            .eq('program_id', program.id)
            .eq('client_id', clientRow.id)
            .maybeSingle()
        : { data: null };

      if (rewardRow && clientRow && account) {
        const eligible =
          account.balance >= rewardRow.cost_points &&
          (!rewardRow.tier_required ||
            rewardRow.tier_required === account.current_tier);

        if (eligible) {
          const discount = computeRewardDiscount(
            {
              rewardType: rewardRow.reward_type as
                | 'percent_off'
                | 'amount_off'
                | 'free_product'
                | 'free_service'
                | 'free_addon',
              config: (rewardRow.config as Record<string, unknown>) ?? {},
              isActive: rewardRow.is_active,
            },
            subtotal
          );
          if (discount.discountCents > 0) {
            discountCents = discount.discountCents;
            loyaltyClientId = clientRow.id;
            loyaltyRewardId = rewardRow.id;
          }
        }
      }
    }
  }

  const total = Math.max(0, subtotal - discountCents) + tipCents;

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
      discount_cents: discountCents,
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
    const piMetadata: Record<string, string> = {
      order_id: order.id,
      business_id: businessId,
      order_type: 'product',
    };
    if (loyaltyRewardId && loyaltyClientId && discountCents > 0) {
      piMetadata.loyalty_reward_id = loyaltyRewardId;
      piMetadata.loyalty_client_id = loyaltyClientId;
      piMetadata.loyalty_discount_cents = String(discountCents);
    }

    // Route via Stripe Connect when the tenant has finished onboarding.
    // For tenants without a connected account this is a no-op and payments
    // continue to flow through the platform account exactly as before.
    const routing = buildConnectRouting(
      {
        stripe_account_id: business.stripe_account_id ?? null,
        stripe_account_status: business.stripe_account_status ?? null,
        platform_fee_percent: business.platform_fee_percent ?? null,
      },
      total
    );

    const pi = await stripe.paymentIntents.create(
      {
        amount: total,
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
        receipt_email: customer.email,
        metadata: piMetadata,
        ...(routing.applicationFeeAmount
          ? { application_fee_amount: routing.applicationFeeAmount }
          : {}),
      },
      routing.requestOptions
    );

    await supabase
      .from('orders')
      .update({ stripe_payment_intent_id: pi.id })
      .eq('id', order.id);

    return NextResponse.json({
      orderId: order.id,
      clientSecret: pi.client_secret,
      amount: total,
      discountCents,
    });
  } catch (err) {
    console.error('Checkout PaymentIntent error:', err);
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
    return NextResponse.json({ error: 'Failed to start payment' }, { status: 500 });
  }
}
