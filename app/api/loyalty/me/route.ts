import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/client';
import { requireBusiness } from '@/lib/tenant/server';
import { getCustomerView } from '@/lib/agents/modules/loyalty';

// GET /api/loyalty/me?orderId=...   (commerce checkout success)
// GET /api/loyalty/me?appointmentId=... (booking confirmation)
// GET /api/loyalty/me                  (logged-in account page; uses auth email)
//
// Public route -- no admin guard. Tenant is resolved from the host.
// Identity is proven by knowing an orderId / appointmentId you just transacted,
// OR by having an auth session. Returns 200 with { customerView: null }
// whenever we can't safely identify the caller, so the widget hides itself.
export async function GET(request: NextRequest) {
  let business;
  try {
    business = await requireBusiness();
  } catch {
    return NextResponse.json({ customerView: null });
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId') ?? undefined;
  const appointmentId = searchParams.get('appointmentId') ?? undefined;

  // Auth email fallback for logged-in customers
  let authEmail: string | undefined;
  if (!orderId && !appointmentId) {
    try {
      const authClient = await createServerSupabaseClient();
      const { data } = await authClient.auth.getUser();
      authEmail = data.user?.email ?? undefined;
    } catch {
      // No session is fine -- we just won't resolve a clients row this way
    }
  }

  if (!orderId && !appointmentId && !authEmail) {
    return NextResponse.json({ customerView: null });
  }

  try {
    const supabase = createAdminClient();
    const customerView = await getCustomerView(supabase, {
      businessId: business.id,
      orderId,
      appointmentId,
      authEmail,
    });
    return NextResponse.json({ customerView });
  } catch (error) {
    console.error('Loyalty me error:', error);
    return NextResponse.json({ customerView: null });
  }
}
