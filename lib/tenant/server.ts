import { cookies, headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { Business, BusinessSettings, TenantContext } from './index';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'x3o.ai';

/**
 * Get tenant slug from request headers/cookies (server-side)
 */
export async function getTenantSlug(): Promise<string | null> {
  const cookieStore = await cookies();
  const headerStore = await headers();

  // Check cookie first (set by middleware)
  const slugFromCookie = cookieStore.get('x-tenant-slug')?.value;
  if (slugFromCookie) {
    return slugFromCookie;
  }

  // Check header (set by middleware)
  const slugFromHeader = headerStore.get('x-tenant-slug');
  if (slugFromHeader) {
    return slugFromHeader;
  }

  // Parse from host header as fallback
  const host = headerStore.get('host') || '';

  if (host.includes('localhost')) {
    const parts = host.split('.');
    if (parts.length > 1 && parts[0] !== 'www') {
      return parts[0].split(':')[0];
    }
  }

  if (host.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = host.replace(`.${ROOT_DOMAIN}`, '');
    if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
      return subdomain;
    }
  }

  return null;
}

/**
 * Get business by slug (server-side with caching)
 */
export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    console.error('Failed to fetch business:', error?.message);
    return null;
  }

  return data as Business;
}

/**
 * Get business settings (server-side)
 */
export async function getBusinessSettings(businessId: string): Promise<BusinessSettings | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('business_settings')
    .select('*')
    .eq('business_id', businessId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as BusinessSettings;
}

/**
 * Get full tenant context (business + settings)
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  const slug = await getTenantSlug();

  if (!slug) {
    return null;
  }

  const business = await getBusinessBySlug(slug);

  if (!business) {
    return null;
  }

  const settings = await getBusinessSettings(business.id);

  return {
    business,
    settings,
  };
}

/**
 * Get current business (throws if not found)
 */
export async function requireBusiness(): Promise<Business> {
  const context = await getTenantContext();

  if (!context?.business) {
    throw new Error('Business not found');
  }

  return context.business;
}

/**
 * Generate metadata for tenant
 */
export function generateTenantMetadata(business: Business, settings: BusinessSettings | null) {
  const siteUrl = business.custom_domain
    ? `https://${business.custom_domain}`
    : `https://${business.slug}.${ROOT_DOMAIN}`;

  // Improved SEO title: prefer meta_title, else business name + city, else business name
  let seoTitle = settings?.meta_title
    || (business.city ? `${business.name} ${business.city}` : business.name)
    || `${business.name} | Book Online`;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: seoTitle,
      template: `%s | ${business.name}`,
    },
    description: settings?.meta_description || `Book your appointment at ${business.name}. ${business.tagline || ''}`,
    icons: {
      icon: business.favicon_url || '/favicon.svg',
      apple: business.favicon_url || '/favicon.svg',
    },
    openGraph: {
      title: seoTitle,
      description: settings?.meta_description || business.tagline || '',
      url: siteUrl,
      siteName: business.name,
      locale: 'en_US',
      type: 'website',
    },
  };
}

/**
 * Generate JSON-LD structured data for tenant
 */
import type { Service } from '@/types/database';

export function generateTenantJsonLd(
  business: Business,
  settings: BusinessSettings | null,
  services?: Service[]
) {
  const siteUrl = business.custom_domain
    ? `https://${business.custom_domain}`
    : `https://${business.slug}.${ROOT_DOMAIN}`;

  const businessType = business.business_type === 'barbershop' ? 'BarberShop' : 'HairSalon';

  const offerCatalog = services && services.length > 0
    ? {
        '@type': 'OfferCatalog',
        name: `${business.name} Services`,
        itemListElement: services.map((service) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: service.name,
            description: service.description,
            category: service.category,
            provider: {
              '@type': businessType,
              name: business.name,
            },
            duration: service.duration ? `${service.duration} minutes` : undefined,
            offers: {
              '@type': 'Offer',
              price: service.base_price,
              priceCurrency: 'USD',
            },
          },
        })),
      }
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': businessType,
    name: business.name,
    description: settings?.meta_description || business.tagline,
    url: siteUrl,
    telephone: business.phone,
    address: business.address ? {
      '@type': 'PostalAddress',
      streetAddress: business.address,
      addressLocality: business.city,
      addressRegion: business.state,
      postalCode: business.zip,
      addressCountry: (business as any).country || 'US',
    } : undefined,
    geo: business.latitude && business.longitude ? {
      '@type': 'GeoCoordinates',
      latitude: business.latitude,
      longitude: business.longitude,
    } : undefined,
    image: business.logo_url ? `${siteUrl}${business.logo_url}` : undefined,
    sameAs: business.instagram_handle
      ? [`https://instagram.com/${business.instagram_handle.replace('@', '')}`]
      : [],
    hasOfferCatalog: offerCatalog,
  };
}
