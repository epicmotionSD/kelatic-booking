import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    const supabase = createAdminClient();

    // Get all stylists with emails
    const { data: stylists, error: fetchError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('role', 'stylist')
      .eq('is_active', true)
      .not('email', 'is', null);

    if (fetchError) {
      console.error('Error fetching stylists:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch stylists' }, { status: 500 });
    }

    if (!stylists || stylists.length === 0) {
      return NextResponse.json({ message: 'No active stylists found', sent: 0 });
    }

    // Create admin auth client for password resets
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const adminAuth = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const results: { email: string; success: boolean; error?: string }[] = [];
    const redirectTo = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`
      : 'https://kelatic.com/reset-password';

    // Send password reset to each stylist
    for (const stylist of stylists) {
      if (!stylist.email) continue;

      try {
        const { error: resetError } = await adminAuth.auth.resetPasswordForEmail(
          stylist.email,
          { redirectTo }
        );

        if (resetError) {
          results.push({
            email: stylist.email,
            success: false,
            error: resetError.message
          });
        } else {
          results.push({ email: stylist.email, success: true });
        }
      } catch (err) {
        results.push({
          email: stylist.email,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success);

    return NextResponse.json({
      message: `Password reset emails sent to ${successful} of ${stylists.length} stylists`,
      sent: successful,
      total: stylists.length,
      failed: failed.length > 0 ? failed : undefined,
      details: results
    });

  } catch (error) {
    console.error('Reset passwords error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
