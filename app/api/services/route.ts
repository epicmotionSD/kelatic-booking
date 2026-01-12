import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // No cache - need fresh tenant data

interface ServiceWithMetrics {
  id: string;
  name: string;
  category: string;
  base_price: number;
  duration: number;
  description?: string;
  is_active: boolean;
  sort_order: number;
  popularity_score?: number;
}

export async function GET() {
  try {
    const supabase = createAdminClient();
    
    // Get tenant slug from headers (set by middleware)
    const headerStore = await headers();
    const tenantSlug = headerStore.get('x-tenant-slug');
    
    // Get business_id from slug
    let businessId: string | null = null;
    if (tenantSlug) {
      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', tenantSlug)
        .eq('is_active', true)
        .single();
      businessId = business?.id || null;
    }
    
    // If no business found, try to get the default Kelatic business
    if (!businessId) {
      const { data: defaultBusiness } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', 'kelatic')
        .single();
      businessId = defaultBusiness?.id || null;
    }

    // Build query with business filter
    let query = supabase
      .from('services')
      .select(`
        id,
        name,
        category,
        base_price,
        duration,
        description,
        sort_order,
        deposit_required,
        deposit_amount,
        is_active
      `)
      .eq('is_active', true)
      .order('category')
      .order('sort_order')
      .order('name');
    
    if (businessId) {
      query = query.eq('business_id', businessId);
    }

    const { data: services, error } = await query;

    if (error) {
      console.error('Error fetching services:', error);
      return NextResponse.json(
        { error: 'Failed to fetch services', services: [] },
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-cache'
          }
        }
      );
    }

    // Optimize response with proper headers
    return NextResponse.json(
      { 
        services: services || [],
        meta: {
          total: services?.length || 0,
          categories: [...new Set(services?.map(s => s.category) || [])]
        }
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=300',
          'X-Total-Count': String(services?.length || 0)
        }
      }
    );
  } catch (error) {
    console.error('Services error:', error);
    return NextResponse.json(
      { error: 'Internal server error', services: [] },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
}
