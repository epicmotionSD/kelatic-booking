import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET() {
  console.log('Reader status API called');
  try {
    const locationId = process.env.STRIPE_TERMINAL_LOCATION_ID;
    console.log('Location ID:', locationId);

    if (!locationId) {
      console.log('No location ID found');
      return NextResponse.json({ reader: null });
    }

    // Get readers for this location
    const readers = await stripe.terminal.readers.list({
      location: locationId,
      limit: 10,
    });

    console.log('Found readers:', readers.data.length);

    if (readers.data.length === 0) {
      return NextResponse.json({ reader: null });
    }

    // Return the first online reader, or the first reader if none are online
    const onlineReader = readers.data.find(reader => reader.status === 'online') || readers.data[0];

    return NextResponse.json({
      reader: {
        id: onlineReader.id,
        label: onlineReader.label,
        status: onlineReader.status,
        device_type: onlineReader.device_type,
        serial_number: onlineReader.serial_number,
        ip_address: onlineReader.ip_address,
        last_seen_at: onlineReader.last_seen_at,
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
