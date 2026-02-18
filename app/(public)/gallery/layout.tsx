import type { Metadata } from 'next';
import { getTenantContext } from '@/lib/tenant/server';

export async function generateMetadata(): Promise<Metadata> {
  const context = await getTenantContext();
  const businessName = context?.business?.name || 'Salon';

  return {
    title: 'Gallery',
    description: `See our work at ${businessName}. Browse photos of locs, braids, color, and more hairstyles from our talented team.`,
  };
}

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
