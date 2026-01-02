import { createClient } from '@/lib/supabase/server';

export interface Business {
  id: string;
  slug: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  business_type: string;
  brand_voice: string;
  tagline: string | null;
  instagram_handle: string | null;
  website_url: string | null;
  stripe_account_id: string | null;
  stripe_account_status: string;
  plan: string;
  features: Record<string, boolean>;
  custom_domain: string | null;
  is_active: boolean;
}

export interface BusinessSettings {
  id: string;
  business_id: string;
  booking_advance_days: number;
  booking_min_notice_hours: number;
  cancellation_hours: number;
  cancellation_policy: string | null;
  deposit_policy: string | null;
  business_hours: Record<string, { open: string; close: string } | null>;
  send_booking_confirmations: boolean;
  send_reminder_24h: boolean;
  send_reminder_2h: boolean;
  send_followup_review: boolean;
  ai_brand_context: string | null;
  ai_hashtags: string[] | null;
  ai_tone: string;
  // Email settings
  sendgrid_api_key_encrypted: string | null;
  sendgrid_from_email: string | null;
  sendgrid_from_name: string | null;
  // SMS settings
  twilio_account_sid_encrypted: string | null;
  twilio_auth_token_encrypted: string | null;
  twilio_phone_number: string | null;
  // SEO
  meta_title: string | null;
  meta_description: string | null;
  google_analytics_id: string | null;
}

export interface TenantContext {
  business: Business;
  settings: BusinessSettings | null;
}

// Root domain for the platform
export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'x3o.ai';

/**
 * Extract subdomain from hostname
 * Handles: localhost, Vercel preview, and production
 */
export function extractSubdomain(hostname: string): string | null {
  // Local development: tenant.localhost:3000
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    const parts = hostname.split('.');
    if (parts.length > 1 && parts[0] !== 'www') {
      // e.g., kelatic.localhost -> kelatic
      return parts[0].split(':')[0]; // Remove port if present
    }
    return null;
  }

  // Vercel preview deployments: tenant---branch-name.vercel.app
  if (hostname.includes('---') && hostname.endsWith('.vercel.app')) {
    const subdomain = hostname.split('---')[0];
    return subdomain || null;
  }

  // Production: tenant.x3o.ai
  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = hostname.replace(`.${ROOT_DOMAIN}`, '');
    if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
      return subdomain;
    }
  }

  // Check for custom domain (enterprise feature)
  // Will be resolved via database lookup
  if (!hostname.includes(ROOT_DOMAIN) && !hostname.includes('localhost')) {
    return `custom:${hostname}`;
  }

  return null;
}

/**
 * Get business by slug from database
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
    return null;
  }

  return data as Business;
}

/**
 * Get business by custom domain
 */
export async function getBusinessByDomain(domain: string): Promise<Business | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('custom_domain', domain)
    .eq('custom_domain_verified', true)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Business;
}

/**
 * Get business settings
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
 * Resolve tenant from hostname
 */
export async function resolveTenant(hostname: string): Promise<TenantContext | null> {
  const subdomain = extractSubdomain(hostname);

  if (!subdomain) {
    return null;
  }

  let business: Business | null = null;

  // Check if it's a custom domain
  if (subdomain.startsWith('custom:')) {
    const domain = subdomain.replace('custom:', '');
    business = await getBusinessByDomain(domain);
  } else {
    business = await getBusinessBySlug(subdomain);
  }

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
 * Build full URL for a business
 */
export function getBusinessUrl(business: Business): string {
  if (business.custom_domain) {
    return `https://${business.custom_domain}`;
  }
  return `https://${business.slug}.${ROOT_DOMAIN}`;
}

/**
 * Check if current request is on the platform root (x3o.ai)
 */
export function isPlatformRoot(hostname: string): boolean {
  const subdomain = extractSubdomain(hostname);
  return subdomain === null;
}
