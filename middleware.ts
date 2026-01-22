import { NextRequest, NextResponse } from 'next/server';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'x3o.ai';

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

  if (!host.includes(ROOT_DOMAIN)) {
    return `custom:${host}`;
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  const subdomain = extractSubdomain(hostname);

  const response = NextResponse.next();

  if (subdomain) {
    response.headers.set('x-tenant-slug', subdomain);
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
