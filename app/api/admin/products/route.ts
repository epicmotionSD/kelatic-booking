import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminBusiness, isGuardErr, slugify } from '@/lib/commerce/guard';
import { taxRateForBusiness } from '@/lib/commerce/tax';
import type { ProductFormPayload } from '@/types/commerce';

// GET /api/admin/products — list this tenant's products (with category)
export async function GET() {
  const guard = await requireAdminBusiness();
  if (isGuardErr(guard)) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const supabase = createAdminClient();
  const { data: products, error } = await supabase
    .from('products')
    .select('*, category:product_categories(*), option_groups:product_option_groups(*, options:product_options(*))')
    .eq('business_id', guard.business.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }

  return NextResponse.json({ products, tax_rate: taxRateForBusiness(guard.business) });
}

// POST /api/admin/products — create a product (+ optional modifier groups)
export async function POST(request: NextRequest) {
  const guard = await requireAdminBusiness();
  if (isGuardErr(guard)) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = (await request.json()) as ProductFormPayload;
  if (!body.name || body.price_cents === undefined || body.price_cents === null) {
    return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const businessId = guard.business.id;

  // Ensure a unique slug within the business
  const baseSlug = slugify(body.name) || 'item';
  let slug = baseSlug;
  for (let i = 2; i < 50; i++) {
    const { data: clash } = await supabase
      .from('products')
      .select('id')
      .eq('business_id', businessId)
      .eq('slug', slug)
      .maybeSingle();
    if (!clash) break;
    slug = `${baseSlug}-${i}`;
  }

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      business_id: businessId,
      category_id: body.category_id || null,
      name: body.name,
      slug,
      description: body.description ?? null,
      image_url: body.image_url ?? null,
      price_cents: Math.round(body.price_cents),
      tags: body.tags ?? [],
      is_featured: body.is_featured ?? false,
      is_active: body.is_active ?? true,
      track_inventory: body.track_inventory ?? false,
      stock_quantity: body.track_inventory ? body.stock_quantity ?? 0 : null,
      fulfillment: 'pickup',
    })
    .select()
    .single();

  if (error || !product) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }

  // Optional modifier groups + options
  if (body.option_groups && body.option_groups.length > 0) {
    for (let g = 0; g < body.option_groups.length; g++) {
      const grp = body.option_groups[g];
      if (!grp.name) continue;
      const { data: group } = await supabase
        .from('product_option_groups')
        .insert({
          product_id: product.id,
          name: grp.name,
          min_select: grp.min_select ?? 0,
          max_select: grp.max_select ?? 1,
          sort_order: g,
        })
        .select()
        .single();

      if (group && grp.options?.length) {
        const rows = grp.options
          .filter((o) => o.name)
          .map((o, idx) => ({
            group_id: group.id,
            name: o.name,
            price_delta_cents: Math.round(o.price_delta_cents || 0),
            is_default: o.is_default ?? false,
            sort_order: idx,
          }));
        if (rows.length) {
          await supabase.from('product_options').insert(rows);
        }
      }
    }
  }

  return NextResponse.json({ product });
}
