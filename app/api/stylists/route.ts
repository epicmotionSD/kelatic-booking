import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');

    const supabase = createAdminClient();

    if (serviceId) {
      // Get stylists who can perform this specific service
      const { data: stylistServices, error } = await supabase
        .from('stylist_services')
        .select(`
          stylist_id,
          profiles!inner (
            id,
            first_name,
            last_name,
            avatar_url,
            bio,
            specialties,
            instagram_handle,
            is_active
          )
        `)
        .eq('service_id', serviceId)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching stylists for service:', error);
        return NextResponse.json({ error: 'Failed to fetch stylists' }, { status: 500 });
      }

      // Extract and dedupe stylists
      const stylists = stylistServices
        ?.map((ss) => ss.profiles)
        .filter((p: any) => p?.is_active)
        .filter((p, index, self) => 
          index === self.findIndex((t: any) => t.id === (p as any).id)
        );

      return NextResponse.json({ stylists: stylists || [] });
    } else {
      // Get all active stylists
      const { data: stylists, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, bio, specialties, instagram_handle')
        .eq('role', 'stylist')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching stylists:', error);
        return NextResponse.json({ error: 'Failed to fetch stylists' }, { status: 500 });
      }

      return NextResponse.json({ stylists: stylists || [] });
    }
  } catch (error) {
    console.error('Stylists error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
