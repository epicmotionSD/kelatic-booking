#!/usr/bin/env node

// Script to generate VAPID keys for push notifications
// Run with: node scripts/generate-vapid-keys.js

const webpush = require('web-push');

console.log('🔑 Generating VAPID keys for push notifications...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID keys generated successfully!\n');

console.log('📋 Add these to your .env.local file:\n');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('VAPID_SUBJECT=mailto:your-email@yourdomain.com');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);

console.log('\n📝 Instructions:');
console.log('1. Copy the above environment variables to your .env.local file');
console.log('2. Replace "your-email@yourdomain.com" with your actual email');
console.log('3. Restart your development server');
console.log('4. Test push notifications in the notification settings page');

console.log('\n⚠️  Security Notes:');
console.log('- Keep the private key secure and never commit it to version control');
console.log('- Use different keys for development and production environments');
console.log('- The public key can be safely exposed to the client side');

console.log('\n🔗 Next Steps:');
console.log('- Configure your web app manifest (if not already done)');
console.log('- Test push notifications in the admin dashboard');
console.log('- Set up proper error monitoring for push delivery');

module.exports = { vapidKeys };