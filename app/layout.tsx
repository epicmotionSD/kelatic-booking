import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kelatic.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Kelatic Hair Lounge | Houston\'s Premier Loc Specialists',
    template: '%s | Kelatic Hair Lounge',
  },
  description: 'Loc In With Houston\'s Premier Loc Specialists. Expert loc installation, maintenance, retwists, and styling by The Loc Gawd with 15+ years experience. Book online at 9430 Richmond Ave, Houston, TX.',
  keywords: ['locs Houston', 'loctician Houston', 'loc retwist Houston', 'starter locs Houston TX', 'loc maintenance', 'loc specialist Houston', 'The Loc Gawd', 'Houston hair salon locs', 'dreadlocks Houston', 'loc installation near me', 'Kelatic Hair Lounge'],
  authors: [{ name: 'Kelatic Hair Lounge' }],
  creator: 'Kelatic Hair Lounge',
  publisher: 'Kelatic Hair Lounge',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'Kelatic Hair Lounge | Houston\'s Premier Loc Specialists',
    description: 'Expert loc installation, maintenance, retwists, and styling in Houston, TX. Founded by The Loc Gawd with 15+ years experience. Book your appointment online today.',
    url: siteUrl,
    siteName: 'Kelatic Hair Lounge',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Kelatic Hair Lounge - Houston\'s Loc Specialists',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kelatic Hair Lounge | Houston\'s Loc Specialists',
    description: 'Expert loc installation, maintenance, retwists, and styling in Houston, TX. Book online today.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  alternates: {
    canonical: siteUrl,
  },
};

// Local Business structured data for SEO
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HairSalon',
  name: 'Kelatic Hair Lounge',
  alternateName: 'Kelatic',
  description: 'Houston\'s premier loc specialists offering expert loc installation, maintenance, retwists, and styling services.',
  url: siteUrl,
  telephone: '+1-713-485-4000',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '9430 Richmond Ave',
    addressLocality: 'Houston',
    addressRegion: 'TX',
    postalCode: '77063',
    addressCountry: 'US',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 29.7289,
    longitude: -95.5277,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '09:00',
      closes: '18:00',
    },
  ],
  priceRange: '$$',
  image: `${siteUrl}/og-image.jpg`,
  sameAs: [
    'https://instagram.com/kelaticlounge',
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Loc Services',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Loc Installation',
          description: 'Professional starter loc installation',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Loc Retwist',
          description: 'Expert loc maintenance and retwisting',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Loc Styling',
          description: 'Creative loc styling and design',
        },
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
