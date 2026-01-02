import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'x3o.ai | White-Label Booking Platform',
  description: 'Launch your own branded booking system with AI-powered content generation. Built for salons, barbershops, and beauty businesses.',
};

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
