const dotenv = require('dotenv');
const { resolve } = require('path');

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const sgMail = require('@sendgrid/mail');
const apiKey = process.env.SENDGRID_API_KEY;

if (!apiKey) {
  console.error('Missing SENDGRID_API_KEY');
  process.exit(1);
}

sgMail.setApiKey(apiKey);

const from = process.env.SENDGRID_FROM_EMAIL || 'hello@kelatic.com';
const to = process.argv[2] || 'shawnsonier04@gmail.com';
const subject = 'Kelatic tracking test';
const html = '<p>Tracking test. <a href="https://kelatic.com/book">Book now</a></p>';

sgMail
  .send({
    to,
    from,
    subject,
    html,
    trackingSettings: { clickTracking: { enable: true }, openTracking: { enable: true } },
    customArgs: { test: 'tracking' },
  })
  .then(([res]) => {
    console.log('Sent', res.statusCode, 'to', to, 'from', from);
  })
  .catch((err) => {
    console.error('Send failed', err?.message || err);
    process.exit(1);
  });
