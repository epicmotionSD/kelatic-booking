import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminBusiness, isGuardErr, slugify } from '@/lib/commerce/guard';

// GET /api/admin/products/categories — list tenant categories
export async function GET() {
  const guard = await requireAdminBusiness();
  if (isGuardErr(guard)) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const supabase = createAdminClient();
  const { data: categories, error } = await supabase
    .from('product_categories')
    .select('*')
    .eq('business_id', guard.business.id)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
  return NextResponse.json({ categories });
}

// POST /api/admin/products/categories — create a category
export async function POST(request: NextRequest) {
  const guard = await requireAdminBusiness();
  if (isGuardErr(guard)) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = await request.json();
  if (!body.name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const businessId = guard.business.id;

  const { data: existing } = await supabase
    .from('product_categories')
    .select('sort_order')
    .eq('business_id', businessId)
    .order('sort_order', { ascending: false })
    .limit(1);
  const sortOrder = existing?.[0]?.sort_order != null ? existing[0].sort_order + 1 : 0;

  const { data: category, error } = await supabase
    .from('product_categories')
    .insert({
      business_id: businessId,
      name: body.name,
      slug: slugify(body.name) || `cat-${sortOrder}`,
      description: body.description ?? null,
      sort_order: sortOrder,
      is_active: true,
    })
    .select()
    .single();

  if (error || !category) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
  return NextResponse.json({ category });
}
