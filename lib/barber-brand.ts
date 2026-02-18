/**
 * Barber Block Brand Detection
 * 
 * Detects when the site is accessed via barbershopblock.ai and provides
 * brand-specific config (colors, names, etc.) for the same Kelatic tenant.
 * 
 * Middleware sets `x-barber-domain` cookie when the request comes from
 * barbershopblock.ai. Client components read this to swap branding.
 */

export interface BarberBrand {
  isBarber: boolean;
  name: string;
  tagline: string;
  accentColor: string;        // Tailwind class prefix (e.g. 'red' or 'amber')
  gradientFrom: string;       // Tailwind gradient from class
  gradientTo: string;         // Tailwind gradient to class
  shadowColor: string;        // Tailwind shadow color class
  logoLetter: string;         // Single letter for the logo
  bookingHeading: string;
  homeUrl: string;
  backLabel: string;
}

const KELATIC_BRAND: BarberBrand = {
  isBarber: false,
  name: 'KELATIC',
  tagline: 'BOOKING',
  accentColor: 'amber',
  gradientFrom: 'from-amber-400',
  gradientTo: 'to-yellow-500',
  shadowColor: 'shadow-amber-500/20',
  logoLetter: 'K',
  bookingHeading: 'Book Your Appointment',
  homeUrl: '/',
  backLabel: '← Back to site',
};

const BARBER_BRAND: BarberBrand = {
  isBarber: true,
  name: 'BARBER BLOCK',
  tagline: 'BY KELATIC',
  accentColor: 'red',
  gradientFrom: 'from-red-500',
  gradientTo: 'to-red-700',
  shadowColor: 'shadow-red-500/20',
  logoLetter: 'BB',
  bookingHeading: 'Book Your Cut',
  homeUrl: '/',
  backLabel: '← Back to Barber Block',
};

/**
 * Check if the current page is served from the barber domain.
 * Works in client components by reading the cookie set by middleware.
 */
export function isBarberDomain(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes('x-barber-domain=1');
}

/**
 * Get the brand config for the current domain.
 */
export function getBrand(): BarberBrand {
  return isBarberDomain() ? BARBER_BRAND : KELATIC_BRAND;
}

/**
 * Server-side: check barber domain from headers (for server components / API routes)
 */
export function isBarberDomainFromHeaders(headersList: Headers): boolean {
  return headersList.get('x-barber-domain') === '1';
}

export { KELATIC_BRAND, BARBER_BRAND };
