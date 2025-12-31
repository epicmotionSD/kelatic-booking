import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kelatic Hair Lounge | Houston\'s Loc Specialists',
  description: 'Loc In With Houston\'s Loc Specialists. Expert loc installation, maintenance, retwists, and styling. Founded by The Loc Gawd with 15+ years experience. Located at 9430 Richmond Ave, Houston, TX.',
  keywords: ['locs', 'loctician', 'Houston locs', 'loc retwist', 'starter locs', 'loc maintenance', 'loc specialist', 'The Loc Gawd'],
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Kelatic Hair Lounge | Houston\'s Loc Specialists',
    description: 'Expert loc installation, maintenance, retwists, and styling in Houston, TX. Founded by The Loc Gawd with 15+ years experience.',
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
