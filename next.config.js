/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@sendgrid/mail', 'twilio'],
  },
  images: {
    domains: ['images.unsplash.com', 'ui-avatars.com'],
  },
};

module.exports = nextConfig;
