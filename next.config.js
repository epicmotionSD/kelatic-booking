/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@sendgrid/mail', 'twilio'],
  images: {
    domains: ['images.unsplash.com', 'ui-avatars.com'],
  },
};

module.exports = nextConfig;
