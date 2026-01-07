import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Cache for 5 minutes

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

    // Optimized query with selective fields and better indexing
    const { data: services, error } = await supabase
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
        deposit_amount
      `)
      .eq('is_active', true)
      .order('category')
      .order('sort_order')
      .order('name');

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
