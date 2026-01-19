import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/tenant/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, heard_about, preferred_stylist_id, preferred_stylist_name } = body || {};

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    const business = await requireBusiness();
    const admin = createAdminClient();

    const { data, error } = await admin
      .from('walk_in_requests')
      .insert({
        business_id: business.id,
        name,
        phone,
        heard_about: heard_about || null,
        preferred_stylist_id: preferred_stylist_id || null,
        preferred_stylist_name: preferred_stylist_name || null,
        status: 'new',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Walk-in request error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create walk-in request' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, requestId: data?.id || null });
  } catch (error) {
    console.error('Walk-in request API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
