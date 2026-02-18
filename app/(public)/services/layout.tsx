import type { Metadata } from 'next';
import { getTenantContext } from '@/lib/tenant/server';

export async function generateMetadata(): Promise<Metadata> {
  const context = await getTenantContext();
  const businessName = context?.business?.name || 'Salon';
  const city = context?.business?.city;

  return {
    title: 'Services & Pricing',
    description: city
      ? `View all services and pricing at ${businessName} in ${city}. Locs, braids, natural hair, color, and more — book online today.`
      : `View all services and pricing at ${businessName}. Book online today.`,
    keywords: city
      ? [`${businessName} prices`, `hair salon ${city}`, 'locs', 'braids', 'natural hair', 'book online']
      : [`${businessName} prices`, 'hair salon', 'book online'],
  };
}

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
