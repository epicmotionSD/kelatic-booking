import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: stylist, error } = await supabase
      .from('profiles')
      .select(`
        *,
        stylist_services(
          services(*)
        ),
        stylist_schedules(*)
      `)
      .eq('id', id)
      .eq('role', 'stylist')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Stylist not found' }, { status: 404 });
    }

    return NextResponse.json({ stylist });
  } catch (error) {
    console.error('Error fetching stylist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createAdminClient();

    const { data: stylist, error } = await supabase
      .from('profiles')
      .update({
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email?.toLowerCase(),
        phone: body.phone,
        bio: body.bio,
        specialties: body.specialties,
        instagram_handle: body.instagram_handle,
        commission_rate: body.commission_rate,
      })
      .eq('id', id)
      .select('id, business_id')
      .single();

    if (error || !stylist) {
      console.error('Error updating stylist:', error);
      return NextResponse.json(
        { error: error?.message || 'Failed to update stylist' },
        { status: 500 }
      );
    }

    // Replace service assignments when serviceIds is provided (undefined = leave alone).
    if (Array.isArray(body.serviceIds)) {
      const { error: deleteError } = await supabase
        .from('stylist_services')
        .delete()
        .eq('stylist_id', id);

      if (deleteError) {
        console.error('[admin/stylists] Failed to clear existing service assignments', {
          stylistId: id,
          error: deleteError.message,
        });
        return NextResponse.json(
          { error: `Failed to update service assignments: ${deleteError.message}` },
          { status: 500 }
        );
      }

      if (body.serviceIds.length > 0) {
        const rows = body.serviceIds.map((serviceId: string) => ({
          stylist_id: id,
          service_id: serviceId,
          business_id: stylist.business_id,
          is_active: true,
        }));
        const { error: insertError } = await supabase
          .from('stylist_services')
          .insert(rows);
        if (insertError) {
          console.error('[admin/stylists] Failed to insert service assignments', {
            stylistId: id,
            error: insertError.message,
          });
          return NextResponse.json(
            { error: `Failed to assign services: ${insertError.message}` },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({ stylist });
  } catch (error: any) {
    console.error('Update stylist error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createAdminClient();

    const updates: any = {};

    if (body.is_active !== undefined) {
      updates.is_active = body.is_active;
    }

    if (body.avatar_url !== undefined) {
      updates.avatar_url = body.avatar_url;
    }

    const { data: stylist, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error patching stylist:', error);
      return NextResponse.json({ error: 'Failed to update stylist' }, { status: 500 });
    }

    return NextResponse.json({ stylist });
  } catch (error) {
    console.error('Patch stylist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
