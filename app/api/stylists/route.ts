import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const revalidate = 180; // Cache for 3 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const barbersOnly = searchParams.get('barbers') === 'true';

    const supabase = createAdminClient();

    if (serviceId) {
      // Optimized query for stylists who can perform specific service
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
            is_active,
            is_barber
          )
        `)
        .eq('service_id', serviceId)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching stylists for service:', error);
        return NextResponse.json(
          { error: 'Failed to fetch stylists', stylists: [] }, 
          { 
            status: 500,
            headers: { 'Cache-Control': 'no-cache' }
          }
        );
      }

      // Extract, filter and dedupe stylists with optimized logic
      let stylists = stylistServices
        ?.map((ss) => ss.profiles)
        .filter((p: any) => p?.is_active)
        .filter((p, index, self) =>
          index === self.findIndex((t: any) => t.id === (p as any).id)
        );

      // Apply barber filter if requested
      if (barbersOnly && stylists) {
        stylists = stylists.filter((p: any) => p?.is_barber === true);
      }

      return NextResponse.json(
        { 
          stylists: stylists || [],
          meta: {
            total: stylists?.length || 0,
            filteredByService: serviceId,
            barbersOnly: barbersOnly
          }
        },
        {
          headers: {
            'Cache-Control': 'public, max-age=180, s-maxage=180',
            'X-Total-Count': String(stylists?.length || 0),
            'X-Service-Filter': serviceId
          }
        }
      );
    } else {
      // Get all active stylists with optimization
      let query = supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, bio, specialties, instagram_handle, is_barber')
        .eq('role', 'stylist')
        .eq('is_active', true);

      if (barbersOnly) {
        query = query.eq('is_barber', true);
      }

      const { data: stylists, error } = await query;

      if (error) {
        console.error('Error fetching stylists:', error);
        return NextResponse.json(
          { error: 'Failed to fetch stylists', stylists: [] }, 
          { 
            status: 500,
            headers: { 'Cache-Control': 'no-cache' }
          }
        );
      }

      return NextResponse.json(
        { 
          stylists: stylists || [],
          meta: {
            total: stylists?.length || 0,
            barbersOnly: barbersOnly
          }
        },
        {
          headers: {
            'Cache-Control': 'public, max-age=180, s-maxage=180',
            'X-Total-Count': String(stylists?.length || 0),
            'X-Filter-Type': barbersOnly ? 'barbers' : 'all'
          }
        }
      );
    }
  } catch (error) {
    console.error('Stylists error:', error);
    return NextResponse.json(
      { error: 'Internal server error', stylists: [] }, 
      { 
        status: 500,
        headers: { 'Cache-Control': 'no-cache' }
      }
    );
  }
}
