import { NextRequest, NextResponse } from 'next/server';
import { getAvailability } from '@/lib/booking/service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('service_id');
    const stylistId = searchParams.get('stylist_id') || undefined;
    const date = searchParams.get('date');
    const duration = searchParams.get('duration');
    const excludeAppointment = searchParams.get('exclude_appointment') || undefined;

    // For rescheduling, we need either service_id or duration
    if ((!serviceId && !duration) || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters: (service_id or duration) and date' },
        { status: 400 }
      );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const availability = await getAvailability({
      service_id: serviceId || undefined,
      stylist_id: stylistId,
      date,
      duration: duration ? parseInt(duration) : undefined,
      exclude_appointment: excludeAppointment,
    });

    return NextResponse.json(availability);
  } catch (error) {
    console.error('Availability error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}
