import type { Metadata } from 'next';
import { getTenantContext } from '@/lib/tenant/server';

export async function generateMetadata(): Promise<Metadata> {
  const context = await getTenantContext();
  const businessName = context?.business?.name || 'Salon';

  return {
    title: 'Blog',
    description: `Hair care tips, style inspiration, and news from ${businessName}. Stay up to date with the latest trends and treatments.`,
  };
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
