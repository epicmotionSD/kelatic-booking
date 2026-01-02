import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Root domain for the platform
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'x3o.ai';

/**
 * Extract subdomain from hostname
 */
function extractSubdomain(hostname: string): string | null {
  // Remove port if present
  const host = hostname.split(':')[0];

  // Local development: tenant.localhost
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    const parts = host.split('.');
    // Only treat as subdomain if format is: tenant.localhost
    if (parts.length === 2 && parts[1] === 'localhost' && parts[0] !== 'www') {
      return parts[0];
    }
    return null;
  }

  // Vercel preview URLs (non-production deployments)
  // Format: project-xxx.vercel.app or kelatic-booking-xxx.vercel.app
  if (host.endsWith('.vercel.app')) {
    // Subdomain format: tenant---project.vercel.app
    if (host.includes('---')) {
      return host.split('---')[0] || null;
    }
    // Regular Vercel preview URL - treat as platform root
    return null;
  }

  // Exact match for root domain - no subdomain
  if (host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) {
    return null;
  }

  // Production: tenant.x3o.ai
  if (host.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = host.replace(`.${ROOT_DOMAIN}`, '');
    if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
      return subdomain;
    }
    return null;
  }

  // Legacy: kelatic.com should go to kelatic tenant
  if (host === 'kelatic.com' || host === 'www.kelatic.com') {
    return 'kelatic';
  }

  // Custom domain - mark for database lookup
  if (!host.includes(ROOT_DOMAIN)) {
    return `custom:${host}`;
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Extract subdomain/tenant
  const subdomain = extractSubdomain(hostname);

  const response = NextResponse.next();

  // Set tenant header for downstream use
  if (subdomain) {
    response.headers.set('x-tenant-slug', subdomain);
  }

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => request.cookies.get(name)?.value } }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ============================================
  // PLATFORM ROOT (x3o.ai) - No subdomain
  // ============================================
  if (!subdomain) {
    // Rewrite root to platform landing page
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/platform', request.url));
    }

    // Platform routes - allow through
    if (pathname.startsWith('/platform') || pathname.startsWith('/onboarding') || pathname.startsWith('/auth')) {
      return response;
    }

    // Platform-level admin routes (Command Center, etc.) - allow through
    if (pathname.startsWith('/admin/command-center')) {
      // Require auth for Command Center
      if (!user) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
      return response;
    }

    // Redirect tenant-only routes to platform landing
    if (pathname.startsWith('/admin') || pathname.startsWith('/book') || pathname.startsWith('/stylist')) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return response;
  }

  // ============================================
  // TENANT SUBDOMAIN (kelatic.x3o.ai)
  // ============================================

  // Resolve business from subdomain (lightweight check via cookie or header)
  // Full resolution happens in the BusinessProvider
  const isCustomDomain = subdomain.startsWith('custom:');
  const tenantSlug = isCustomDomain ? subdomain.replace('custom:', '') : subdomain;

  // Set cookies for client-side access
  response.cookies.set('x-tenant-slug', tenantSlug, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  // Protect /admin routes
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user is business admin (will be verified in page with full context)
    // For now, allow through - page will handle authorization
  }

  // Protect /stylist routes
  if (pathname.startsWith('/stylist')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('type', 'stylist');
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect /account routes
  if (pathname.startsWith('/account')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('type', 'client');
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)',
  ],
};
