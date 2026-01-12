import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/tenant/server';

export async function GET() {
  try {
    const business = await requireBusiness();
    const supabase = await createClient();

    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', business.id)
      .order('category')
      .order('sort_order');

    if (error) {
      console.error('Error fetching services:', error);
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }

    return NextResponse.json({ services });
  } catch (error) {
    console.error('Services error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const business = await requireBusiness();
    const body = await request.json();
    const supabase = await createClient();

    // Get max sort_order for category within this business
    const { data: existing } = await supabase
      .from('services')
      .select('sort_order')
      .eq('category', body.category)
      .eq('business_id', business.id)
      .order('sort_order', { ascending: false })
      .limit(1);

    const sortOrder = existing?.[0]?.sort_order
      ? existing[0].sort_order + 1
      : 0;

    // Add business_id for multi-tenant support
    const { data: service, error } = await supabase
      .from('services')
      .insert({
        name: body.name,
        description: body.description,
        category: body.category,
        base_price: body.base_price,
        duration: body.duration,
        deposit_required: body.deposit_required,
        deposit_amount: body.deposit_amount,
        sort_order: sortOrder,
        is_active: true,
        business_id: business.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating service:', error);
      return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
    }

    // Handle stylist assignments if provided
    if (body.stylistIds && body.stylistIds.length > 0) {
      const assignments = body.stylistIds.map((stylistId: string) => ({
        service_id: service.id,
        stylist_id: stylistId,
        business_id: business.id,
        is_active: true
      }));

      const { error: assignmentError } = await supabase
        .from('stylist_services')
        .insert(assignments);

      if (assignmentError) {
        console.error('Error creating stylist assignments:', assignmentError);
        // Service created but assignments failed - log warning but don't fail the request
        console.warn('Service created but stylist assignments failed');
      }
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error('Create service error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
