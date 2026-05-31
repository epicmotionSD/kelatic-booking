import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/client';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, business_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.business_id || !['admin', 'owner'].includes(profile.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  // Delete only if it's a business-wide closure for the caller's business.
  // Belt and suspenders so this can't be used to nuke a per-stylist time-off entry.
  const { error, count } = await admin
    .from('stylist_time_off')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('business_id', profile.business_id)
    .is('stylist_id', null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!count) {
    return NextResponse.json({ error: 'Closure not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
