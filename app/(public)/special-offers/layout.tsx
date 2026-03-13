import type { Metadata } from 'next';
import { getTenantContext } from '@/lib/tenant/server';

export async function generateMetadata(): Promise<Metadata> {
  const context = await getTenantContext();
  const businessName = context?.business?.name || 'Salon';
  const city = context?.business?.city;

  return {
    title: 'Special Offers',
    description: `Current deals and special offers at ${businessName}. Save on your next appointment — limited time promotions available now.`,
    keywords: city
      ? [
          `${businessName} special offers`,
          `hair salon deals ${city}`,
          `retwist special ${city}`,
          'wednesday special',
          'salon promotions',
        ]
      : ['special offers', 'hair salon deals', 'retwist special', 'wednesday special', 'salon promotions'],
  };
}

export default function SpecialOffersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
