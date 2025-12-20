import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();

    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        services!inner(*),
        stylist:profiles!appointments_stylist_id_fkey(*),
        client:profiles!appointments_client_id_fkey(*),
        payments(*),
        appointment_addons(*, services(*))
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const supabase = createAdminClient();

    const updates: any = {};

    if (body.status !== undefined) {
      updates.status = body.status;
    }

    if (body.start_time !== undefined) {
      updates.start_time = body.start_time;
    }

    if (body.end_time !== undefined) {
      updates.end_time = body.end_time;
    }

    if (body.stylist_id !== undefined) {
      updates.stylist_id = body.stylist_id;
    }

    if (body.client_notes !== undefined) {
      updates.client_notes = body.client_notes;
    }

    if (body.internal_notes !== undefined) {
      updates.internal_notes = body.internal_notes;
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating appointment:', error);
      return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();

    // Soft delete - just mark as cancelled
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to cancel appointment' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
