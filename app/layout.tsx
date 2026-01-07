import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { GoogleAnalytics } from '@next/third-parties/google';
import { headers } from 'next/headers';
import './globals.css';
import { getTenantContext, generateTenantMetadata, generateTenantJsonLd } from '@/lib/tenant/server';
import { BusinessProvider, BusinessThemeStyle } from '@/lib/tenant/context';
import { getAnalyticsId, getGoogleAdsConfig } from '@/lib/tenant-config';

const inter = Inter({ subsets: ['latin'] });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'x3o.ai';
const platformUrl = `https://${ROOT_DOMAIN}`;

// Default metadata for platform root (x3o.ai)
const platformMetadata: Metadata = {
  metadataBase: new URL(platformUrl),
  title: {
    default: 'x3o.ai | White-Label Booking Platform for Salons',
    template: '%s | x3o.ai',
  },
  description: 'Launch your own branded booking system with AI-powered content generation. Built for salons, barbershops, and beauty businesses.',
  keywords: ['salon software', 'booking system', 'white label', 'AI marketing', 'salon booking'],
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'x3o.ai | White-Label Booking Platform',
    description: 'Launch your own branded booking system with AI-powered content generation.',
    url: platformUrl,
    siteName: 'x3o.ai',
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

  // Generate JSON-LD for tenant or platform
  const jsonLd = business
    ? generateTenantJsonLd(business, settings)
    : {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'x3o.ai',
        applicationCategory: 'BusinessApplication',
        description: 'White-label booking platform for salons and beauty businesses',
      };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {business && <BusinessThemeStyle business={business} />}
      </head>
      <body className={`${inter.className} ${playfair.variable}`} suppressHydrationWarning={true}>
        <BusinessProvider business={business} settings={settings}>
          {children}
        </BusinessProvider>
        
        {/* Dynamic Google Analytics/Ads - optimized for Vercel */}
        {analyticsId && <GoogleAnalytics gaId={analyticsId} />}
      </body>
    </html>
  );
}
