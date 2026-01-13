import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'x3o.ai | Revenue Injection Engine for Salons',
  description: 'Stop losing money to ghost clients and empty chairs. Our AI workforce reactivates dormant clients, fills last-minute cancellations, and recovers lost revenue—while you work.',
  openGraph: {
    title: 'x3o.ai | Revenue Injection Engine',
    description: 'Your clients are leaking revenue. Ghost clients. Dead DMs. Empty chairs. We plug the leaks. You keep the money.',
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
