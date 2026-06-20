import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminBusiness, isGuardErr } from '@/lib/commerce/guard';

// PATCH /api/admin/products/[id] — update fields (scoped to tenant)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requireAdminBusiness();
  if (isGuardErr(guard)) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = await request.json();
  const supabase = createAdminClient();

  // Whitelist updatable columns
  const allowed = [
    'category_id',
    'name',
    'description',
    'image_url',
    'price_cents',
    'tags',
    'is_featured',
    'is_active',
    'sort_order',
    'track_inventory',
    'stock_quantity',
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }
  if ('price_cents' in update && update.price_cents != null) {
    update.price_cents = Math.round(Number(update.price_cents));
  }

  const { data: product, error } = await supabase
    .from('products')
    .update(update)
    .eq('id', id)
    .eq('business_id', guard.business.id)
    .select()
    .single();

  if (error || !product) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }

  return NextResponse.json({ product });
}

// DELETE /api/admin/products/[id] — soft delete (deactivate) by default
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requireAdminBusiness();
  if (isGuardErr(guard)) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const hard = new URL(request.url).searchParams.get('hard') === 'true';
  const supabase = createAdminClient();

  if (hard) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('business_id', guard.business.id);
    if (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
    return NextResponse.json({ success: true, deleted: true });
  }

  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', id)
    .eq('business_id', guard.business.id);

  if (error) {
    console.error('Error deactivating product:', error);
    return NextResponse.json({ error: 'Failed to deactivate product' }, { status: 500 });
  }
  return NextResponse.json({ success: true, deactivated: true });
}
