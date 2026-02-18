import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'x3o.ai';

// Barber Block domain aliases — all resolve to Kelatic tenant with barber branding
const BARBER_DOMAINS = ['barbershopblock.ai', 'www.barbershopblock.ai'];

// Routes allowed on the barber domain (everything else redirects to /)
const BARBER_ALLOWED_ROUTES = [
  '/book',
  '/barber-block',
  '/login',
  '/reset-password',
  '/api',
  '/dashboard',
  '/admin',
  '/stylist',
  '/account',
  '/auth',
  '/appointments',
  '/walk-in',
  '/privacy-policy',
  '/unsubscribe',
];

function extractSubdomain(hostname: string): string | null {
  const host = hostname.split(':')[0];

  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    const parts = host.split('.');
    if (parts.length === 2 && parts[1] === 'localhost' && parts[0] !== 'www') {
      return parts[0];
    }
    if (process.env.NODE_ENV === 'development' && (host === 'localhost' || host === '127.0.0.1')) {
      return 'kelatic';
    }
    return null;
  }

  if (host.endsWith('.vercel.app')) {
    if (host.includes('---')) {
      return host.split('---')[0] || null;
    }
    return null;
  }

  if (host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) {
    return null;
  }

  if (host.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = host.replace(`.${ROOT_DOMAIN}`, '');
    if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
      return subdomain;
    }
    return null;
  }

  if (host === 'kelatic.com' || host === 'www.kelatic.com') {
    return 'kelatic';
  }

  // Barber Block domain → treat as Kelatic tenant (barber branding applied in middleware)
  if (BARBER_DOMAINS.includes(host)) {
    return 'kelatic';
  }

  if (!host.includes(ROOT_DOMAIN)) {
    return `custom:${host}`;
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  const subdomain = extractSubdomain(hostname);

  // Propagate tenant slug via request headers so server components can read it
  if (subdomain) {
    const isCustomDomain = subdomain.startsWith('custom:');
    const tenantSlug = isCustomDomain ? subdomain.replace('custom:', '') : subdomain;
    request.headers.set('x-tenant-slug', tenantSlug);
  }

  // Create Supabase client for auth check (uses patched request headers)
  const { supabase, response } = createClient(request);

  if (subdomain) {
    response.headers.set('x-tenant-slug', subdomain);
  }

  // Check authentication for protected routes
  const protectedRoutes = ['/dashboard', '/admin', '/stylist', '/account'];
  const publicRoutes = ['/login', '/reset-password', '/api', '/platform', '/onboarding', '/auth', '/book', '/_next', '/favicon.ico'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute && !isPublicRoute) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Set tenant slug cookie early (before any early returns) ─────
  if (subdomain) {
    const isCustomDomainEarly = subdomain.startsWith('custom:');
    const tenantSlugEarly = isCustomDomainEarly ? subdomain.replace('custom:', '') : subdomain;
    response.cookies.set('x-tenant-slug', tenantSlugEarly, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  // ── Barber Block domain handling ──────────────────────────────────
  const host = hostname.split(':')[0];
  const isBarberDomain = BARBER_DOMAINS.includes(host);

  if (isBarberDomain) {
    // Set barber branding flag (read by client via cookie, server via header)
    response.cookies.set('x-barber-domain', '1', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    response.headers.set('x-barber-domain', '1');
    request.headers.set('x-barber-domain', '1');

    // Homepage → serve the barber-block page
    if (pathname === '/') {
      const rewriteUrl = new URL('/barber-block', request.url);
      const rewriteResponse = NextResponse.rewrite(rewriteUrl, {
        request: { headers: request.headers },
      });
      // Copy cookies from response to rewrite response
      response.cookies.getAll().forEach((cookie) => {
        rewriteResponse.cookies.set(cookie.name, cookie.value, cookie);
      });
      return rewriteResponse;
    }

    // /book → inject category=barber if not already set
    if (pathname === '/book' && !request.nextUrl.searchParams.has('category')) {
      const bookUrl = new URL('/book', request.url);
      request.nextUrl.searchParams.forEach((value, key) => {
        bookUrl.searchParams.set(key, value);
      });
      bookUrl.searchParams.set('category', 'barber');
      return NextResponse.redirect(bookUrl);
    }

    // Block Kelatic-specific routes → redirect to /
    const isAllowed = BARBER_ALLOWED_ROUTES.some(route => pathname.startsWith(route)) || pathname === '/';
    if (!isAllowed) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  } else {
    // Clear barber cookie on non-barber domains
    response.cookies.set('x-barber-domain', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  }

  if (!subdomain) {
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/platform', request.url));
    }

    if (pathname.startsWith('/platform') || pathname.startsWith('/onboarding') || pathname.startsWith('/auth')) {
      return response;
    }

    if (pathname.startsWith('/dashboard')) {
      return response;
    }

    if (pathname.startsWith('/admin')) {
      return response;
    }

    if (pathname.startsWith('/api')) {
      return response;
    }

    if (pathname.startsWith('/book') || pathname.startsWith('/stylist')) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return response;
  }

  const isCustomDomain = subdomain.startsWith('custom:');
  const tenantSlug = isCustomDomain ? subdomain.replace('custom:', '') : subdomain;

  // Cookie already set earlier, but ensure it's up to date
  response.cookies.set('x-tenant-slug', tenantSlug, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)',
  ],
};
