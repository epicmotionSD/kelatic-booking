import type { Metadata } from 'next';
import { getTenantContext } from '@/lib/tenant/server';

export async function generateMetadata(): Promise<Metadata> {
  const context = await getTenantContext();
  const businessName = context?.business?.name || 'Salon';

  return {
    title: 'Walk-In Booking',
    description: `Walk-in appointment booking at ${businessName}. No account needed — just pick your service and book.`,
  };
}

export default function WalkInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
