import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST() {
  try {
    const locationId = process.env.STRIPE_TERMINAL_LOCATION_ID;

    if (!locationId) {
      return NextResponse.json(
        { error: 'Terminal location not configured' },
        { status: 500 }
      );
    }

    // Get online readers
    const readers = await stripe.terminal.readers.list({
      location: locationId,
      status: 'online',
    });

    if (!readers.data.length) {
      return NextResponse.json(
        { error: 'No online readers' },
        { status: 400 }
      );
    }

    // Cancel action on the first reader
    // In a multi-reader setup, you'd want to track which reader is being used
    const reader = readers.data[0];

    try {
      await stripe.terminal.readers.cancelAction(reader.id);
    } catch (cancelError: any) {
      // It's okay if there's no action to cancel
      if (!cancelError.message?.includes('no action')) {
        throw cancelError;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel reader error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel reader action' },
      { status: 500 }
    );
  }
}
