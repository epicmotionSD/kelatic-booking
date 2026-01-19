import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/tenant/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    let businessId: string | null = null;

    try {
      const business = await requireBusiness();
      businessId = business.id;
    } catch (error) {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('business_id')
        .eq('id', user.id)
        .single();

      businessId = profile?.business_id || null;

      if (!businessId) {
        const { data: member } = await supabase
          .from('business_members')
          .select('business_id')
          .eq('user_id', user.id)
          .single();

        businessId = member?.business_id || null;
      }

      if (!businessId) {
        return NextResponse.json({ error: 'Business not found' }, { status: 404 });
      }
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('walk_in_requests')
      .select('id, name, phone, heard_about, preferred_stylist_name, status, created_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Walk-in requests error:', error);
      return NextResponse.json({ error: 'Failed to fetch walk-in requests' }, { status: 500 });
    }

    return NextResponse.json({ requests: data || [] });
  } catch (error) {
    console.error('Walk-in requests API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
