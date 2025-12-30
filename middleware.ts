import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Only protect /admin routes
  if (pathname.startsWith('/admin')) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name: string) => request.cookies.get(name)?.value } }
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const allowedAdmins = ['kelatic@gmail.com', 'shawnsonnier04@gmail.com'];
    if (!user || !user.email || !allowedAdmins.includes(user.email)) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
