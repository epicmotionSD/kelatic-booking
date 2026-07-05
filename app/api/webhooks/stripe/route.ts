import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { stripe, constructWebhookEvent } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/client';
import { sendConfirmationByAppointmentId, sendOrderNotifications } from '@/lib/notifications/service';
import { awardPointsForEvent, redeemReward } from '@/lib/agents/modules/loyalty';
import { summarizeAccount } from '@/lib/stripe/connect';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = constructWebhookEvent(body, signature);
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      // Payment succeeded
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update payment record
        await supabase
          .from('payments')
          .update({
            status: 'paid',
            stripe_charge_id: paymentIntent.latest_charge as string,
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        // Product order paid (Vitality House storefront or in-store register).
        // metadata.order_id is set by /api/shop/checkout and /api/admin/pos/order.
        const orderId = paymentIntent.metadata?.order_id;
        if (orderId) {
          // Read the prior status so we can fire notifications exactly once —
          // Stripe can retry a webhook, and we only want to email on the real
          // pending→paid transition, not on a replay of an already-paid order.
          const { data: priorOrder } = await supabase
            .from('orders')
            .select('status')
            .eq('id', orderId)
            .maybeSingle();
          const wasAlreadyPaid = priorOrder?.status === 'paid';

          await supabase.from('orders').update({ status: 'paid' }).eq('id', orderId);

          // Sale notifications — customer receipt (online only, needs an email)
          // + owner alert. Online storefront orders set order_type=product;
          // in-store register card sales don't, so we treat those as in_store.
          if (!wasAlreadyPaid) {
            const channel =
              paymentIntent.metadata?.order_type === 'product' ? 'online' : 'in_store';
            after(async () => {
              await sendOrderNotifications(orderId, { channel });
            });
          }

          const { data: existingPay } = await supabase
            .from('payments')
            .select('id')
            .eq('stripe_payment_intent_id', paymentIntent.id)
            .maybeSingle();

          if (!existingPay) {
            await supabase.from('payments').insert({
              order_id: orderId,
              business_id: paymentIntent.metadata?.business_id || null,
              amount: paymentIntent.amount / 100,
              total_amount: paymentIntent.amount / 100,
              status: 'paid',
              method: 'card_online',
              stripe_payment_intent_id: paymentIntent.id,
              stripe_charge_id: paymentIntent.latest_charge as string,
            });
          }

          console.log(`Order paid: ${orderId}`);

          // Loyalty earn — runs after the response is sent so a slow earn
          // can't stall the webhook ack. Idempotent on order_id.
          after(async () => {
            try {
              const { data: order } = await supabase
                .from('orders')
                .select('business_id, customer_email, customer_phone, customer_name, subtotal_cents')
                .eq('id', orderId)
                .single();
              if (!order) return;
              await awardPointsForEvent(supabase, {
                businessId: order.business_id,
                trigger: 'order.paid',
                orderId,
                amountCents: order.subtotal_cents ?? 0,
                customerEmail: order.customer_email ?? undefined,
                customerPhone: order.customer_phone ?? undefined,
                customerName: order.customer_name ?? undefined,
              });
            } catch (err) {
              console.error('Loyalty earn failed (order):', err);
            }
          });

          // Loyalty redemption — only if checkout attached a reward to
          // the PaymentIntent metadata. The actual account debit happens
          // here, not at checkout time, so a failed/cancelled payment
          // never deducts points. redeemReward is idempotent via the
          // (account_id, reason='redeem', order_id) shape -- a webhook
          // replay won't double-redeem.
          const rewardId = paymentIntent.metadata?.loyalty_reward_id;
          const loyaltyClientId = paymentIntent.metadata?.loyalty_client_id;
          if (rewardId && loyaltyClientId) {
            after(async () => {
              try {
                const { data: order } = await supabase
                  .from('orders')
                  .select('business_id')
                  .eq('id', orderId)
                  .single();
                if (!order) return;
                const { data: existing } = await supabase
                  .from('loyalty_transactions')
                  .select('id')
                  .eq('order_id', orderId)
                  .eq('reason', 'redeem')
                  .maybeSingle();
                if (existing) return;
                await redeemReward(supabase, {
                  businessId: order.business_id,
                  clientId: loyaltyClientId,
                  rewardId,
                  orderId,
                });
              } catch (err) {
                console.error('Loyalty redeem failed (order):', err);
              }
            });
          }
        }

        // If this completes a deposit, confirm the appointment and send the
        // booking confirmation email/SMS — the booking POST skips the immediate
        // send for pending bookings so we don't tell customers "you're booked"
        // before they've actually paid.
        if (paymentIntent.metadata?.is_deposit === 'true') {
          const appointmentId = paymentIntent.metadata.appointment_id;
          await supabase
            .from('appointments')
            .update({ status: 'confirmed' })
            .eq('id', appointmentId);

          if (appointmentId) {
            after(async () => {
              await sendConfirmationByAppointmentId(appointmentId, 'stripe_webhook');
            });
            // Note: loyalty earn for appointments fires on actual completion,
            // not on deposit-paid -- see app/api/pos/complete-appointment.
          }
        }

        console.log(`Payment succeeded: ${paymentIntent.id}`);
        break;
      }

      // Payment failed
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        console.log(`Payment failed: ${paymentIntent.id}`);
        break;
      }

      // Payment canceled
      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        console.log(`Payment canceled: ${paymentIntent.id}`);
        break;
      }

      // Refund created
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        
        // Find payment by charge ID and update
        await supabase
          .from('payments')
          .update({
            status: charge.refunded ? 'refunded' : 'partial',
            refund_amount: (charge.amount_refunded || 0) / 100,
            refunded_at: new Date().toISOString(),
          })
          .eq('stripe_charge_id', charge.id);

        console.log(`Refund processed: ${charge.id}`);
        break;
      }

      // Terminal reader action succeeded
      case 'terminal.reader.action_succeeded': {
        const reader = event.data.object as Stripe.Terminal.Reader;
        console.log(`Reader action succeeded: ${reader.id}`);
        break;
      }

      // Terminal reader action failed
      case 'terminal.reader.action_failed': {
        const reader = event.data.object as Stripe.Terminal.Reader;
        console.log(`Reader action failed: ${reader.id}`);
        break;
      }

      // Subscription created
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        const businessId = subscription.metadata.business_id;

        if (businessId) {
          await supabase
            .from('businesses')
            .update({
              stripe_subscription_id: subscription.id,
              plan_status: subscription.status,
              subscription_current_period_start: new Date(
                subscription.current_period_start * 1000
              ).toISOString(),
              subscription_current_period_end: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
              trial_ends_at: subscription.trial_end
                ? new Date(subscription.trial_end * 1000).toISOString()
                : null,
            })
            .eq('id', businessId);

          console.log(`Subscription created: ${subscription.id}`);
        }
        break;
      }

      // Subscription updated
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const businessId = subscription.metadata.business_id;

        if (businessId) {
          await supabase
            .from('businesses')
            .update({
              plan_status: subscription.status,
              subscription_current_period_start: new Date(
                subscription.current_period_start * 1000
              ).toISOString(),
              subscription_current_period_end: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
              subscription_cancel_at_period_end: subscription.cancel_at_period_end,
              subscription_canceled_at: subscription.canceled_at
                ? new Date(subscription.canceled_at * 1000).toISOString()
                : null,
            })
            .eq('id', businessId);

          console.log(`Subscription updated: ${subscription.id}`);
        }
        break;
      }

      // Subscription deleted
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const businessId = subscription.metadata.business_id;

        if (businessId) {
          await supabase
            .from('businesses')
            .update({
              plan_status: 'canceled',
              subscription_canceled_at: new Date().toISOString(),
            })
            .eq('id', businessId);

          console.log(`Subscription canceled: ${subscription.id}`);
        }
        break;
      }

      // Trial will end soon (3 days before)
      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;
        const businessId = subscription.metadata.business_id;

        if (businessId) {
          // TODO: Send email notification about trial ending
          console.log(`Trial ending soon for subscription: ${subscription.id}`);
        }
        break;
      }

      // Invoice paid successfully
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const businessId = invoice.subscription_details?.metadata?.business_id;

        if (businessId) {
          // Update subscription status to active if it was past_due
          await supabase
            .from('businesses')
            .update({ plan_status: 'active' })
            .eq('id', businessId)
            .eq('plan_status', 'past_due');

          console.log(`Invoice paid: ${invoice.id}`);
        }
        break;
      }

      // Invoice payment failed
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const businessId = invoice.subscription_details?.metadata?.business_id;

        if (businessId) {
          // Update subscription status to past_due
          await supabase
            .from('businesses')
            .update({ plan_status: 'past_due' })
            .eq('id', businessId);

          // TODO: Send email notification about failed payment
          console.log(`Invoice payment failed: ${invoice.id}`);
        }
        break;
      }

      // Checkout session completed (for one-time payments like Revenue Sprint)
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const businessId = session.metadata?.business_id;

        if (businessId && session.metadata?.product_type === 'revenue_sprint') {
          // TODO: Track Revenue Sprint purchase and trigger campaign setup
          console.log(`Revenue Sprint purchased: ${session.id}`);
        }
        break;
      }

      // Connected-account status changes (KYC complete, capability flipped,
      // requirements added, etc.). Keep businesses.stripe_account_status in
      // sync so the admin badge + payment routing react without the owner
      // having to refresh the settings page.
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        const summary = summarizeAccount(account);
        await supabase
          .from('businesses')
          .update({ stripe_account_status: summary.status })
          .eq('stripe_account_id', account.id);
        console.log(`Connect account updated: ${account.id} → ${summary.status}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

