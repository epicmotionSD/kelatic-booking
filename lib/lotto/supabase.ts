'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Lotto Duel runs on its own Supabase project — separate auth, separate data,
// zero overlap with the salon booking client in lib/supabase.
let client: SupabaseClient | null = null;

export function lottoClient(): SupabaseClient {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_LOTTO_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_LOTTO_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
