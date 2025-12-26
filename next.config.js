/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@sendgrid/mail', 'twilio'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
    ],
  },
};

module.exports = nextConfig;
