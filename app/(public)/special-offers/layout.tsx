import type { Metadata } from 'next';
import { getTenantContext } from '@/lib/tenant/server';

export async function generateMetadata(): Promise<Metadata> {
  const context = await getTenantContext();
  const businessName = context?.business?.name || 'Salon';

  return {
    title: 'Special Offers',
    description: `Current deals and special offers at ${businessName}. Save on your next appointment — limited time promotions available now.`,
  };
}

export default function SpecialOffersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
