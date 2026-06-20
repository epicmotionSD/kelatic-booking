import { redirect } from 'next/navigation';
import { requireAdminBusiness, isGuardErr } from '@/lib/commerce/guard';
import PaymentsClient from './PaymentsClient';

export const dynamic = 'force-dynamic';

interface SearchParams {
  stripe_return?: string;
  stripe_refresh?: string;
}

export default async function PaymentsSettingsPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const guard = await requireAdminBusiness();
  if (isGuardErr(guard)) {
    if (guard.status === 401) redirect('/login');
    return (
      <div className="x3o-term p-6">
        <p className="text-sm text-red-400">{guard.error}</p>
      </div>
    );
  }

  const sp = await props.searchParams;
  const justReturned = sp.stripe_return === '1';

  return (
    <PaymentsClient
      businessName={guard.business.name}
      businessSlug={guard.business.slug}
      initialAccountId={guard.business.stripe_account_id ?? null}
      initialStatus={guard.business.stripe_account_status ?? null}
      platformFeePercent={Number(guard.business.platform_fee_percent ?? 0)}
      justReturned={justReturned}
    />
  );
}
