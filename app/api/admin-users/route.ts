import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

// GET /api/admin-users - fetch admin users by email
export async function GET(request: NextRequest) {
  const emails = ['kelatic@gmail.com', 'shawnsonnier04@gmail.com'];
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('email', emails)
    .eq('role', 'admin');

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch admin users' }, { status: 500 });
  }

  return NextResponse.json({ admins: data });
}
