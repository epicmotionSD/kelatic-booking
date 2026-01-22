import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/tenant/server';

export async function GET() {
  try {
    const business = await requireBusiness();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('stylist_services')
      .select('service_id')
      .eq('business_id', business.id)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching stylist service counts:', error);
      return NextResponse.json({ error: 'Failed to fetch stylist counts' }, { status: 500 });
    }

    const counts: Record<string, number> = {};
    for (const row of data || []) {
      if (!row.service_id) continue;
      counts[row.service_id] = (counts[row.service_id] || 0) + 1;
    }

    return NextResponse.json({ counts });
  } catch (error) {
    console.error('Stylist counts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
