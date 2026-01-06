import { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const { serviceId } = await request.json();
    const supabase = createRouteHandlerClient<Database>({ cookies });

    if (!serviceId) {
      return Response.json(
        { error: 'Service ID is required' },
        { status: 400 }
      );
    }

    // Get service details
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (serviceError || !service) {
      return Response.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Get available stylists for this service
    const { data: stylists, error: stylistsError } = await supabase
      .from('stylist_services')
      .select(`
        stylist_id,
        profiles:profiles!stylist_services_stylist_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url,
          bio,
          specialties
        )
      `)
      .eq('service_id', serviceId);

    if (stylistsError) {
      return Response.json(
        { error: 'Error fetching stylists' },
        { status: 500 }
      );
    }

    const availableStylists = stylists?.map(s => s.profiles).filter(Boolean) || [];

    return Response.json({
      success: true,
      service,
      stylists: availableStylists,
      // Return booking URL with pre-selected service
      bookingUrl: `/book?service=${serviceId}`
    });

  } catch (error) {
    console.error('Quick booking error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}