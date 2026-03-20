import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { GoogleAnalytics } from '@next/third-parties/google';
import { headers } from 'next/headers';
import './globals.css';
import { getTenantContext, generateTenantMetadata, generateTenantJsonLd } from '@/lib/tenant/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { Service } from '@/types/database';
import { BusinessProvider, BusinessThemeStyle } from '@/lib/tenant/context';
import { getAnalyticsId, getGoogleAdsConfig } from '@/lib/tenant-config';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';

const inter = Inter({ subsets: ['latin'] });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'x3o.ai';
const platformUrl = `https://${ROOT_DOMAIN}`;

// Default metadata for platform root (x3o.ai)
const platformMetadata: Metadata = {
  metadataBase: new URL(platformUrl),
  title: {
    default: 'x3o Intelligence | Claude-Powered B2B Intelligence Marketplace',
    template: '%s | x3o Intelligence',
  },
  description: 'The first Claude-powered vertical intelligence marketplace. Production-ready AI systems for beauty, restaurants, fitness, retail, med spas, and legal — deployed in days, not months.',
  keywords: ['ai intelligence marketplace', 'claude api vertical ai', 'b2b ai platform', 'mcp server marketplace', 'service business ai', 'revenue recovery ai', 'ghost client reactivation', 'anthropic mcp'],
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'x3o Intelligence | Claude-Powered B2B Intelligence Marketplace',
    description: 'Production-ready AI systems for 6 service verticals. Social metrics, competitor intel, campaign tracking, booking funnel analysis — all powered by Claude.',
    url: platformUrl,
    siteName: 'x3o Intelligence',
    type: 'website',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const context = await getTenantContext();

  // Platform root - no tenant
  if (!context?.business) {
    return platformMetadata;
  }

  // Tenant-specific metadata
  return generateTenantMetadata(context.business, context.settings);
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getTenantContext();
  const business = context?.business || null;
  const settings = context?.settings || null;

  // Get the incoming hostname for analytics
  const headersList = await headers();
  const host = headersList.get('host');

  // Get the correct analytics ID for this tenant/domain
  const analyticsId = getAnalyticsId(host);
  const googleAdsConfig = getGoogleAdsConfig(host);

  // Fetch all active services for the tenant (for schema markup)
  let services: Service[] = [];
  if (business) {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from('services')
      .select('*')
      .eq('business_id', business.id)
      .eq('is_active', true);
    services = data || [];
  }

  // Generate JSON-LD for tenant or platform
  const jsonLd = business
    ? generateTenantJsonLd(business, settings, services)
    : {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'x3o Intelligence',
        applicationCategory: 'BusinessApplication',
        description: 'Claude-powered vertical intelligence marketplace delivering production-ready AI systems for service businesses',
      };

  const siteUrl = business
    ? (business.custom_domain
        ? `https://${business.custom_domain}`
        : `https://${business.slug}.${ROOT_DOMAIN}`)
    : platformUrl;

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: business?.name || 'x3o Intelligence',
    url: siteUrl,
  };

  const combinedJsonLd = [jsonLd, websiteJsonLd];

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={business?.name || 'x3o Intelligence'} />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(combinedJsonLd) }}
        />
        {business && <BusinessThemeStyle business={business} />}
      </head>
      <body className={`${inter.className} ${playfair.variable} overflow-x-hidden bg-[#010409]`} suppressHydrationWarning={true}>
        <BusinessProvider business={business} settings={settings}>
          {children}
          <PwaInstallPrompt />
        </BusinessProvider>
        {/* Dynamic Google Analytics/Ads - optimized for Vercel */}
        {analyticsId && <GoogleAnalytics gaId={analyticsId} />}
      </body>
    </html>
  );
}
