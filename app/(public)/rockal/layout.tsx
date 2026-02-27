import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rockal Roberts — The Loc Gawd | KeLatic Hair Lounge',
  description:
    'Book your loc services with Rockal Roberts, The Loc Gawd. Expert retwists, starter locs, micro locs, loc extensions, and more in Houston. Online booking available 24/7.',
  keywords: [
    'loc retwist houston',
    'starter locs',
    'micro locs',
    'loc extensions',
    'loc grooming',
    'Rockal Roberts',
    'The Loc Gawd',
    'kelatic',
    'houston locs',
  ],
};

export default function RockalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
