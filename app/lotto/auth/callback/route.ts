import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Magic-link landing for the LottoDuel Supabase project.
// Separate from /auth/callback, which belongs to the salon project.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const nextParam = url.searchParams.get('next') ?? '/lotto';
  // Only ever redirect inside the tenant (no open redirects)
  const next = nextParam.startsWith('/lotto') ? nextParam : '/lotto';

  if (code) {
    const cookieStore = await cookies(); // async in Next 15
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_LOTTO_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_LOTTO_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
          set: (name: string, value: string, options: CookieOptions) => {
            cookieStore.set({ name, value, ...options });
          },
          remove: (name: string, options: CookieOptions) => {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }

  return NextResponse.redirect(new URL('/lotto?error=auth_failed', url.origin));
}
