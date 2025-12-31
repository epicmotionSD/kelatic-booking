import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => request.cookies.get(name)?.value } }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect /admin routes - admins only
  if (pathname.startsWith('/admin')) {
    const allowedAdmins = ['kelatic@gmail.com', 'shawnsonnier04@gmail.com'];
    if (!user || !user.email || !allowedAdmins.includes(user.email)) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect /stylist routes - stylists only
  if (pathname.startsWith('/stylist')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('type', 'stylist');
      return NextResponse.redirect(loginUrl);
    }
    // Role check happens in the page (we need to query profile)
  }

  // Protect /account routes - clients only
  if (pathname.startsWith('/account')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('type', 'client');
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/stylist/:path*', '/account/:path*'],
};
