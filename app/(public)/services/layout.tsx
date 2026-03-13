import type { Metadata } from 'next';
import { getTenantContext } from '@/lib/tenant/server';

export async function generateMetadata(): Promise<Metadata> {
  const context = await getTenantContext();
  const businessName = context?.business?.name || 'Salon';
  const city = context?.business?.city;

  return {
    title: 'Services & Pricing',
    description: city
      ? `View all services and pricing at ${businessName} in ${city}. Loc services, retwists, starter locs, and maintenance — book online today.`
      : `View all services and pricing at ${businessName}. Book online today.`,
    keywords: city
      ? [
          `${businessName} prices`,
          `hair salon ${city}`,
          `loc services ${city}`,
          `retwist ${city}`,
          'starter locs',
          'book online',
        ]
      : [`${businessName} prices`, 'hair salon', 'loc services', 'retwist', 'book online'],
  };
}

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
