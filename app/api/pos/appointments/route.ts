import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/tenant/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    let business_id: string | null = null;

    try {
      const business = await requireBusiness();
      business_id = business.id;
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

      business_id = profile?.business_id || null;

      if (!business_id) {
        const { data: member } = await supabase
          .from('business_members')
          .select('business_id')
          .eq('user_id', user.id)
          .single();

        business_id = member?.business_id || null;
      }

      if (!business_id) {
        return NextResponse.json({ error: 'Business not found' }, { status: 404 });
      }
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client:profiles!appointments_client_id_fkey (
          id,
          first_name,
          last_name,
          phone,
          email
        ),
        stylist:profiles!appointments_stylist_id_fkey (
          id,
          first_name,
          last_name
        ),
        service:services (
          id,
          name,
          base_price,
          duration
        ),
        addons:appointment_addons (
          id,
          price,
          service:services (
            id,
            name
          )
        ),
        payments (
          id,
          amount,
          status,
          is_deposit
        )
      `)
      .eq('business_id', business_id)
      .gte('start_time', today.toISOString())
      .lt('start_time', tomorrow.toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error);
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
    }

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('POS appointments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
