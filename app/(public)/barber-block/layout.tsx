import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Barber Block | Premium Barber Services',
  description: 'Fresh fades, lineups, and premium cuts from Houston\'s finest barbers. Book your appointment online at Barber Block by KeLatic Hair Lounge.',
  keywords: ['barber houston', 'fade haircut', 'lineup', 'barber near me', 'barber block', 'houston barber'],
};

export default function BarberBlockLayout({ children }: { children: React.ReactNode }) {
  return children;
}
