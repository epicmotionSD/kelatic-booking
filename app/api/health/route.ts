import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Keep-alive endpoint — pinged by Vercel Cron every 3 days
// to prevent the free-tier Supabase project from auto-pausing.
export async function GET() {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, businesses: count, ts: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
