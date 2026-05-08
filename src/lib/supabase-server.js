/**
 * Supabase server client — used in Server Components, middleware, and
 * server actions to read the session from cookies.
 *
 * Next.js 14 App Router: cookies() is async in Next 15+ but sync in 14.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createSupabaseServer() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try { cookieStore.set({ name, value, ...options }); } catch {}
        },
        remove(name, options) {
          try { cookieStore.set({ name, value: '', ...options }); } catch {}
        },
      },
    }
  );
}
