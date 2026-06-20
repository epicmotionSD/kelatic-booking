import { redirect } from 'next/navigation';
import { requireAdminBusiness, isGuardErr } from '@/lib/commerce/guard';
import { createAdminClient } from '@/lib/supabase/client';
import {
  getProgramForBusiness,
  listMembers,
  listRewards,
  listReferrals,
  listReferralLeaders,
} from '@/lib/agents/modules/loyalty';
import LoyaltyAdmin from './LoyaltyAdmin';

export const dynamic = 'force-dynamic';

export default async function LoyaltyAdminPage() {
  const guard = await requireAdminBusiness();
  if (isGuardErr(guard)) {
    if (guard.status === 401) redirect('/login');
    return (
      <div className="x3o-term p-6">
        <p className="text-sm text-red-400">{guard.error}</p>
      </div>
    );
  }

  const supabase = createAdminClient();
  const [program, members, rewards, referrals, leaders] = await Promise.all([
    getProgramForBusiness(supabase, guard.business.id),
    listMembers(supabase, guard.business.id, { limit: 100 }),
    listRewards(supabase, guard.business.id),
    listReferrals(supabase, guard.business.id, { limit: 50 }),
    listReferralLeaders(supabase, guard.business.id, { limit: 10 }),
  ]);

  return (
    <LoyaltyAdmin
      businessName={guard.business.name}
      initialProgram={program}
      initialMembers={members}
      initialRewards={rewards}
      initialReferrals={referrals}
      initialLeaders={leaders}
    />
  );
}
