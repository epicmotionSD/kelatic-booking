import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getTenantContext } from '@/lib/tenant/server';

export async function generateMetadata(): Promise<Metadata> {
  const context = await getTenantContext();
  const headerStore = await headers();
  const host = headerStore.get('host') || '';
  const cleanHost = host.split(':')[0];
  const isBarber = cleanHost === 'barbershopblock.ai' || cleanHost === 'www.barbershopblock.ai'
    || headerStore.get('x-barber-domain') === '1';

  if (isBarber) {
    return {
      title: 'Book Your Cut',
      description: 'Book a fresh fade, lineup, or premium cut at Barber Block. Online booking available 24/7 — pick your barber and time.',
      keywords: [
        'book barber appointment',
        'book haircut online',
        'houston barber booking',
        'fade appointment',
        'lineup appointment',
        'barber block',
      ],
    };
  }

  const businessName = context?.business?.name || 'Salon';
  const city = context?.business?.city;

  return {
    title: 'Book Online',
    description: `Book your appointment at ${businessName}. Choose your service, stylist, and time — easy online booking available 24/7.`,
    keywords: city
      ? [
          `book ${businessName}`,
          `book hair appointment ${city}`,
          `book loctician ${city}`,
          'book retwist online',
          'online salon booking',
        ]
      : ['book hair appointment', 'book loctician', 'book retwist online', 'online salon booking'],
  };
}

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
