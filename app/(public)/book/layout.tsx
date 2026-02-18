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
    };
  }

  const businessName = context?.business?.name || 'Salon';

  return {
    title: 'Book Online',
    description: `Book your appointment at ${businessName}. Choose your service, stylist, and time — easy online booking available 24/7.`,
  };
}

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
