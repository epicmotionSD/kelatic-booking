import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

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

    if (!service_id || !stylist_id) {
      return NextResponse.json(
        { error: 'Service and stylist are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Create the walk-in appointment
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        service_id,
        stylist_id,
        start_time,
        end_time,
        quoted_price,
        is_walk_in: true,
        walk_in_name: walk_in_name || 'Walk-in',
        walk_in_phone: walk_in_phone || null,
        status: 'in_progress', // Walk-ins start immediately
      })
      .select(`
        *,
        service:services(*),
        stylist:profiles!appointments_stylist_id_fkey(id, first_name, last_name)
      `)
      .single();

    if (error) {
      console.error('Walk-in creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create walk-in appointment' },
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
