import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Missing payment intent ID' },
        { status: 400 }
      );
    }

    // Get the reader
    const locationId = process.env.STRIPE_TERMINAL_LOCATION_ID;
    
    if (!locationId) {
      return NextResponse.json(
        { error: 'Terminal location not configured' },
        { status: 500 }
      );
    }

    // List online readers at this location
    const readers = await stripe.terminal.readers.list({
      location: locationId,
      status: 'online',
    });

    if (!readers.data.length) {
      return NextResponse.json(
        { error: 'No online readers available' },
        { status: 400 }
      );
    }

    // Use the first available reader (in a multi-reader setup, you'd want to select)
    const reader = readers.data[0];

    // Send payment to the reader
    const result = await stripe.terminal.readers.processPaymentIntent(
      reader.id,
      {
        payment_intent: paymentIntentId,
      }
    );

    return NextResponse.json({
      success: true,
      readerId: reader.id,
      action: result.action,
    });
  } catch (error: any) {
    console.error('Process terminal error:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process payment on terminal' },
      { status: 500 }
    );
  }
}
