import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

// Returns which days of the week (0=Sun … 6=Sat) a specific stylist has active schedules.
// Used by the booking calendar to gray out days the stylist doesn't work.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const stylistId = searchParams.get('stylist_id');

  if (!stylistId) {
    return NextResponse.json({ error: 'stylist_id required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('stylist_schedules')
    .select('day_of_week')
    .eq('stylist_id', stylistId)
    .eq('is_active', true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const working_days = (data ?? []).map(r => r.day_of_week);

  return NextResponse.json({ working_days });
}
