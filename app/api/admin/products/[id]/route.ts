import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminBusiness, isGuardErr } from '@/lib/commerce/guard';
import type { ProductFormPayload } from '@/types/commerce';

type OptionGroupInput = NonNullable<ProductFormPayload['option_groups']>[number];

// Replace a product's modifier/add-on groups wholesale. The edit form always
// sends the complete set, so we clear the existing groups (options cascade)
// and re-insert. An empty array simply removes all add-ons.
async function replaceOptionGroups(
  supabase: ReturnType<typeof createAdminClient>,
  productId: string,
  groups: OptionGroupInput[]
) {
  await supabase.from('product_option_groups').delete().eq('product_id', productId);

  for (let g = 0; g < groups.length; g++) {
    const grp = groups[g];
    if (!grp.name?.trim()) continue;
    const { data: group } = await supabase
      .from('product_option_groups')
      .insert({
        product_id: productId,
        name: grp.name.trim(),
        min_select: grp.min_select ?? 0,
        max_select: grp.max_select ?? 1,
        sort_order: g,
      })
      .select()
      .single();

    if (group && grp.options?.length) {
      const rows = grp.options
        .filter((o) => o.name?.trim())
        .map((o, idx) => ({
          group_id: group.id,
          name: o.name.trim(),
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

  // Update scalar columns if any were sent, otherwise just confirm the product
  // belongs to this business (so we can still sync its add-ons below).
  const { data: product, error } = Object.keys(update).length
    ? await supabase
        .from('products')
        .update(update)
        .eq('id', id)
        .eq('business_id', guard.business.id)
        .select()
        .single()
    : await supabase
        .from('products')
        .select()
        .eq('id', id)
        .eq('business_id', guard.business.id)
        .single();

  if (error || !product) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }

  // Sync modifier/add-on groups when the edit form includes them.
  if (Array.isArray(body.option_groups)) {
    try {
      await replaceOptionGroups(supabase, id, body.option_groups as OptionGroupInput[]);
    } catch (err) {
      console.error('Error updating product option groups:', err);
      return NextResponse.json({ error: 'Failed to update add-ons' }, { status: 500 });
    }
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
