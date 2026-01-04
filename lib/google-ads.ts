/**
 * Google Ads Conversion Tracking
 *
 * Usage:
 * - trackBookingConversion() - Call when a booking is completed
 * - trackLeadConversion() - Call when someone submits contact form
 * - trackPageView() - Call for custom page views
 */

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const BOOKING_CONVERSION_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOKING_CONVERSION;
const LEAD_CONVERSION_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION;

/**
 * Track a completed booking as a conversion
 * @param value - The booking value in dollars
 * @param currency - Currency code (default: USD)
 */
export function trackBookingConversion(value?: number, currency = 'USD') {
  if (typeof window === 'undefined' || !window.gtag || !GOOGLE_ADS_ID) return;

  if (BOOKING_CONVERSION_ID) {
    window.gtag('event', 'conversion', {
      send_to: `${GOOGLE_ADS_ID}/${BOOKING_CONVERSION_ID}`,
      value: value || 0,
      currency: currency,
    });
  }

  // Also send as a GA4 event for analytics
  window.gtag('event', 'booking_complete', {
    event_category: 'conversions',
    event_label: 'booking',
    value: value || 0,
  });
}

/**
 * Track a lead form submission
 */
export function trackLeadConversion() {
  if (typeof window === 'undefined' || !window.gtag || !GOOGLE_ADS_ID) return;

  if (LEAD_CONVERSION_ID) {
    window.gtag('event', 'conversion', {
      send_to: `${GOOGLE_ADS_ID}/${LEAD_CONVERSION_ID}`,
    });
  }

  window.gtag('event', 'generate_lead', {
    event_category: 'conversions',
    event_label: 'lead_form',
  });
}

/**
 * Track page views for specific pages
 */
export function trackPageView(pagePath: string, pageTitle?: string) {
  if (typeof window === 'undefined' || !window.gtag || !GOOGLE_ADS_ID) return;

  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: pageTitle,
  });
}

/**
 * Track when someone starts the booking process
 */
export function trackBookingStart() {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'begin_checkout', {
    event_category: 'engagement',
    event_label: 'booking_started',
  });
}

/**
 * Track when someone views a service
 */
export function trackServiceView(serviceName: string, servicePrice?: number) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'view_item', {
    event_category: 'engagement',
    event_label: serviceName,
    value: servicePrice || 0,
  });
}
