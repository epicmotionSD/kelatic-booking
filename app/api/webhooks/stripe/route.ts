import { NextRequest, NextResponse } from 'next/server';
import { stripe, constructWebhookEvent } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/client';
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

        // If this completes a deposit, confirm the appointment
        if (paymentIntent.metadata?.is_deposit === 'true') {
          await supabase
            .from('appointments')
            .update({ status: 'confirmed' })
            .eq('id', paymentIntent.metadata.appointment_id);
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

