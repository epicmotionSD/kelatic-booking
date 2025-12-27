import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET() {
  console.log('Reader status API called');
  try {
    const locationId = process.env.STRIPE_TERMINAL_LOCATION_ID;
    console.log('Location ID from env:', locationId);
    console.log('All env vars starting with STRIPE:', Object.keys(process.env).filter(key => key.startsWith('STRIPE')).join(', '));

    if (!locationId) {
      console.log('No location ID found in environment');
      return NextResponse.json({ reader: null, debug: { locationId: null, availableEnvVars: Object.keys(process.env).filter(key => key.startsWith('STRIPE')) } });
    }

    // First, let's check what locations exist
    const locations = await stripe.terminal.locations.list({ limit: 10 });
    console.log('Available locations:', locations.data.map(loc => ({ id: loc.id, display_name: loc.display_name })));

    // Get readers for this location
    const readers = await stripe.terminal.readers.list({
      location: locationId,
      limit: 10,
    });

    console.log('Found readers:', readers.data.length);
    console.log('Readers data:', JSON.stringify(readers.data, null, 2));

    if (readers.data.length === 0) {
      console.log('No readers found for location:', locationId);
      return NextResponse.json({ reader: null });
    }

    // Return the first online reader, or the first reader if none are online
    const onlineReader = readers.data.find(reader => reader.status === 'online') || readers.data[0];

    console.log('Selected reader:', JSON.stringify(onlineReader, null, 2));

    return NextResponse.json({
      reader: {
        id: onlineReader.id,
        label: onlineReader.label,
        status: onlineReader.status,
        device_type: onlineReader.device_type,
        serial_number: onlineReader.serial_number,
        ip_address: onlineReader.ip_address,
        location: onlineReader.location,
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
