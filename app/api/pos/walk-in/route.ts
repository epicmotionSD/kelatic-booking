import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/tenant/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      walk_in_name,
      walk_in_phone,
      service_id,
      stylist_id,
      start_time,
      end_time,
      quoted_price,
    } = body;

    if (!service_id || !stylist_id || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Service, stylist, start time, and end time are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const business = await requireBusiness();
    const business_id = business.id;

    // Create the walk-in appointment
    const insertPayload = {
      business_id,
      service_id,
      stylist_id,
      start_time,
      end_time,
      quoted_price,
      is_walk_in: true,
      walk_in_name: walk_in_name || 'Walk-in',
      walk_in_phone: walk_in_phone || null,
      status: 'in_progress', // Walk-ins start immediately
    };

    let appointmentResult = await supabase
      .from('appointments')
      .insert(insertPayload)
      .select(`
        *,
        service:services(*),
        stylist:profiles!appointments_stylist_id_fkey(id, first_name, last_name)
      `)
      .single();

    if (appointmentResult.error) {
      const admin = createAdminClient();
      appointmentResult = await admin
        .from('appointments')
        .insert(insertPayload)
        .select(`
          *,
          service:services(*),
          stylist:profiles!appointments_stylist_id_fkey(id, first_name, last_name)
        `)
        .single();
    }

    const { data: appointment, error } = appointmentResult;

    if (error) {
      console.error('Walk-in creation error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create walk-in appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error('Walk-in API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
