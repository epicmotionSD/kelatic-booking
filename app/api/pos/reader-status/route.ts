import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET() {
  try {
    const locationId = process.env.STRIPE_TERMINAL_LOCATION_ID;

    if (!locationId) {
      return NextResponse.json({ reader: null });
    }

    // List all readers at this location
    const readers = await stripe.terminal.readers.list({
      location: locationId,
    });

    if (!readers.data.length) {
      return NextResponse.json({ reader: null });
    }

    // Return the first reader (or primary reader in multi-reader setup)
    const reader = readers.data[0];

    return NextResponse.json({
      reader: {
        id: reader.id,
        label: reader.label || 'Stripe Reader',
        status: reader.status,
        device_type: reader.device_type,
        serial_number: reader.serial_number,
        ip_address: reader.ip_address,
        last_seen_at: reader.status === 'online' ? new Date().toISOString() : null,
      },
    });
  } catch (error) {
    console.error('Reader status error:', error);
    return NextResponse.json(
      { error: 'Failed to get reader status', reader: null },
      { status: 500 }
    );
  }
}
