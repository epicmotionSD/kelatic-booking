import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kelatic Hair Lounge | Houston\'s Loc Experts',
  description: 'Loc In With Houston\'s Loc Experts. Professional hair care services specializing in locs, braids, and natural hair styling. Located at 9430 Richmond Ave, Houston, TX.',
  keywords: ['hair salon', 'locs', 'braids', 'natural hair', 'Houston', 'black hair care', 'loc maintenance', 'hair styling'],
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Kelatic Hair Lounge | Houston\'s Loc Experts',
    description: 'Professional loc care and natural hair styling in Houston, TX. Expert stylists specializing in loc maintenance, braids, and protective styles.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
