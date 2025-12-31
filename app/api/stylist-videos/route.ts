import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('stylist_videos')
      .select(`
        id,
        youtube_url,
        title,
        description,
        sort_order,
        stylist:profiles!stylist_id (
          id,
          first_name,
          last_name,
          avatar_url,
          bio,
          specialties,
          instagram_handle
        )
      `)
      .eq('is_featured', true)
      .order('sort_order');

    if (error) {
      console.error('Error fetching stylist videos:', error);
      return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
    }

    return NextResponse.json({ videos: data || [] });
  } catch (error) {
    console.error('Stylist videos error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
