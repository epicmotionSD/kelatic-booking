import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'KeLatic Hair Lounge | Expert Loc Styling & Hair Care',
  description: 'Book your appointment at KeLatic Hair Lounge. Specializing in locs, braids, natural hair styling, and more. Located in Houston, TX.',
  keywords: ['hair salon', 'locs', 'braids', 'natural hair', 'Houston', 'black hair care'],
  openGraph: {
    title: 'KeLatic Hair Lounge',
    description: 'Your Hair, Our Passion. Expert styling for locs, braids, and natural hair.',
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
      <body className={inter.className}>{children}</body>
    </html>
  );
}
