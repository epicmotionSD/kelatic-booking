import { NextRequest, NextResponse } from 'next/server';
import { createTerminalPaymentIntent } from '@/lib/stripe';
import { toCents } from '@/lib/currency';
import { createAdminClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { appointmentId, amount, tipAmount } = await request.json();

    if (!appointmentId || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const totalAmount = amount + (tipAmount || 0);

    // Create payment intent for terminal
    const paymentIntent = await createTerminalPaymentIntent({
      amount: totalAmount,
      appointmentId,
      metadata: {
        tip_amount: String(tipAmount || 0),
      },
    });

    // Record pending payment in database
    const supabase = createAdminClient();
    await supabase.from('payments').insert({
      appointment_id: appointmentId,
      amount: amount / 100, // Convert back to dollars for DB
      tip_amount: (tipAmount || 0) / 100,
      total_amount: totalAmount / 100,
      status: 'pending',
      method: 'card_terminal',
      stripe_payment_intent_id: paymentIntent.id,
    });

    return NextResponse.json({
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
