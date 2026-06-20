import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/tenant/server';
import type { Business } from '@/lib/tenant';

export interface GuardOk {
  business: Business;
  userId: string;
}
export interface GuardErr {
  error: string;
  status: 401 | 403 | 404;
}

/**
 * Resolve the current tenant and confirm the signed-in user is an
 * owner/admin of it. Checks business_members first, then falls back to
 * profiles.role (legacy single-business admins). Returns the business on
 * success so callers can scope writes with createAdminClient().
 */
export async function requireAdminBusiness(): Promise<GuardOk | GuardErr> {
  let business: Business;
  try {
    business = await requireBusiness();
  } catch {
    return { error: 'Business not found', status: 404 };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Authentication required', status: 401 };
  }

  // Preferred: multi-tenant membership
  const { data: member } = await supabase
    .from('business_members')
    .select('role')
    .eq('business_id', business.id)
    .eq('user_id', user.id)
    .maybeSingle();

  let role = member?.role as string | undefined;

  // Fallback: legacy profiles.role tied to a single business
  if (!role) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, business_id')
      .eq('id', user.id)
      .maybeSingle();
    if (profile && profile.business_id === business.id) {
      role = profile.role as string;
    }
  }

  if (!role || !['owner', 'admin'].includes(role)) {
    return { error: 'Insufficient permissions', status: 403 };
  }

  return { business, userId: user.id };
}

export function isGuardErr(r: GuardOk | GuardErr): r is GuardErr {
  return (r as GuardErr).error !== undefined;
}

/** Simple URL slug generator. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
