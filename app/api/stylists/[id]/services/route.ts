import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stylists/[id]/services
 * Returns services assigned to a specific stylist via stylist_services join table.
 * Includes custom_price overrides when set.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: stylistId } = await params;

    if (!stylistId) {
      return NextResponse.json(
        { error: 'Stylist ID is required', services: [] },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('stylist_services')
      .select(`
        custom_price,
        services!inner (
          id,
          name,
          category,
          base_price,
          duration,
          description,
          deposit_required,
          deposit_amount,
          is_active,
          sort_order
        )
      `)
      .eq('stylist_id', stylistId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching stylist services:', error);
      return NextResponse.json(
        { error: 'Failed to fetch services', services: [] },
        { status: 500, headers: { 'Cache-Control': 'no-cache' } }
      );
    }

    // Flatten and apply custom_price overrides
    const services = (data || [])
      .map((row: any) => {
        const svc = row.services;
        if (!svc || !svc.is_active) return null;
        return {
          id: svc.id,
          name: svc.name,
          category: svc.category,
          base_price: row.custom_price ?? svc.base_price,
          duration: svc.duration,
          description: svc.description,
          deposit_required: svc.deposit_required,
          deposit_amount: svc.deposit_amount,
          sort_order: svc.sort_order,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return (a.sort_order || 0) - (b.sort_order || 0);
      });

    return NextResponse.json(
      {
        services,
        meta: {
          total: services.length,
          stylistId,
          categories: [...new Set(services.map((s: any) => s.category))],
        },
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Total-Count': String(services.length),
        },
      }
    );
  } catch (error) {
    console.error('Stylist services error:', error);
    return NextResponse.json(
      { error: 'Internal server error', services: [] },
      { status: 500, headers: { 'Cache-Control': 'no-cache' } }
    );
  }
}
