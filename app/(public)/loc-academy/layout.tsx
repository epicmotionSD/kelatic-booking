import type { Metadata } from 'next';
import { getTenantContext } from '@/lib/tenant/server';

export async function generateMetadata(): Promise<Metadata> {
  const context = await getTenantContext();
  const businessName = context?.business?.name || 'Salon';

  return {
    title: 'Loc Academy',
    description: `Learn about loc care, maintenance, and styling at ${businessName} Loc Academy. Expert tips for starter locs, retwists, and more.`,
    keywords: ['loc care', 'loc maintenance', 'starter locs', 'retwist', 'loc academy', 'loc styles'],
  };
}

export default function LocAcademyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
