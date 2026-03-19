import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'x3o.ai | Revenue Recovery AI for Service Businesses',
  description: 'Recover lost revenue from ghost clients, cold conversations, and empty slots. x3o.ai integrates with your existing booking tools to reactivate demand automatically.',
  openGraph: {
    title: 'x3o.ai | Revenue Recovery AI',
    description: 'Not another booking platform. x3o.ai plugs revenue leaks by reactivating dormant clients, recovering abandoned conversations, and filling cancelled slots.',
    type: 'website',
  },
};

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
