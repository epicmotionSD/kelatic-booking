// Multi-tenant Analytics Configuration
// Maps domains to their respective Google Analytics IDs

export const tenantAnalytics: Record<string, string> = {
  // Kelatic Hair Lounge (AI-Enhanced)
  'kelatic.x3o.ai': 'AW-937265883',           // Kelatic's Google Ads ID
  'kelatic.com': 'AW-937265883',              // Same ID for kelatic.com if used
  'book.kelatic.com': 'AW-937265883',         // Subdomain support

  // x3o.ai Platform (Multi-tenant SaaS)
  'x3o.ai': 'G-PLATFORM123456',               // Platform-level analytics
  'www.x3o.ai': 'G-PLATFORM123456',
  
  // Development/Testing
  'localhost:3000': 'G-TESTID123456',         // Test environment
  'localhost:3001': 'G-TESTID123456',
};

export const tenantGoogleAds: Record<string, { adsId: string; bookingConversion?: string; leadConversion?: string; } | null> = {
  // Kelatic Hair Lounge Google Ads Configuration
  'kelatic.x3o.ai': {
    adsId: 'AW-937265883',
    bookingConversion: process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOKING_CONVERSION,
    leadConversion: process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION,
  },
  'kelatic.com': {
    adsId: 'AW-937265883',
    bookingConversion: process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOKING_CONVERSION,
    leadConversion: process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION,
  },
  
  // x3o.ai Platform - No ads tracking needed
  'x3o.ai': null,
};

/**
 * Get Google Analytics ID for the current domain
 * @param host - The hostname from request headers
 * @returns Analytics ID or null
 */
export function getAnalyticsId(host: string | null): string | null {
  if (!host) return null;
  
  // Strip port if present (e.g. localhost:3000)
  const cleanHost = host.split(':')[0];
  
  // Return specific tenant ID or fallback to platform ID
  return tenantAnalytics[cleanHost] || tenantAnalytics['x3o.ai'];
}

/**
 * Get Google Ads configuration for the current domain
 * @param host - The hostname from request headers
 * @returns Google Ads config or null
 */
export function getGoogleAdsConfig(host: string | null) {
  if (!host) return null;
  
  const cleanHost = host.split(':')[0];
  return tenantGoogleAds[cleanHost] || null;
}

/**
 * Check if current domain is a tenant (vs platform)
 * @param host - The hostname from request headers
 * @returns boolean
 */
export function isTenantDomain(host: string | null): boolean {
  if (!host) return false;
  
  const cleanHost = host.split(':')[0];
  
  // Platform domains
  const platformDomains = ['x3o.ai', 'www.x3o.ai'];
  
  return !platformDomains.includes(cleanHost);
}