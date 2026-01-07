/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic configuration to test if complex webpack config is causing issues
  reactStrictMode: true,
  
  // Minimal external packages
  serverExternalPackages: [
    '@supabase/supabase-js',
    'web-push',
    'twilio',
    '@sendgrid/mail',
    '@anthropic-ai/sdk'
  ],

  // Basic image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      }
    ],
    formats: ['image/webp'],
  },

  // Output configuration for deployment
  output: 'standalone',
  
  // Disable complex webpack optimizations temporarily
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Only basic external packages
      config.externals = [
        ...config.externals,
        'web-push',
        'twilio',
        '@sendgrid/mail'
      ];
    }
    return config;
  },
};

module.exports = nextConfig;