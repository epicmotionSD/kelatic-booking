import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .order('category')
      .order('sort_order');

    if (error) {
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
    const body = await request.json();
    const supabase = createAdminClient();

    // Get max sort_order for category
    const { data: existing } = await supabase
      .from('services')
      .select('sort_order')
      .eq('category', body.category)
      .order('sort_order', { ascending: false })
      .limit(1);

    const sortOrder = existing?.[0]?.sort_order 
      ? existing[0].sort_order + 1 
      : 0;

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
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating service:', error);
      return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error('Create service error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
