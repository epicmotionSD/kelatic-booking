import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/tenant/server';
import { taxRateForBusiness } from '@/lib/commerce/tax';

export const dynamic = 'force-dynamic';

// GET /api/shop/products — public catalog for the current tenant (active only)
export async function GET() {
  let business;
  try {
    business = await requireBusiness();
  } catch {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 });
  }

  const supabase = createAdminClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, slug, description, image_url, price_cents, currency, tags, is_featured, category_id, sort_order, track_inventory, stock_quantity, option_groups:product_option_groups(id, name, min_select, max_select, sort_order, options:product_options(id, name, price_delta_cents, is_default, is_active, sort_order))')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('product_categories')
      .select('id, name, slug, sort_order')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ]);

  return NextResponse.json({
    business: {
      name: business.name,
      tagline: business.tagline,
      primary_color: business.primary_color,
      tax_rate: taxRateForBusiness(business),
    },
    categories: categories || [],
    products: products || [],
  });
}
