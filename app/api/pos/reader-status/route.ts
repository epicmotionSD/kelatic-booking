import { NextResponse } from 'next/server';

export async function GET() {
  console.log('Reader status API called');
  try {
    const locationId = process.env.STRIPE_TERMINAL_LOCATION_ID;
    console.log('Location ID:', locationId);

    if (!locationId) {
      console.log('No location ID found');
      return NextResponse.json({ reader: null });
    }

    // For now, just return a test response
    return NextResponse.json({
      reader: {
        id: 'test-reader',
        label: 'Test Reader',
        status: 'offline',
        device_type: 'test',
        serial_number: 'TEST123',
        ip_address: null,
        last_seen_at: null,
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
