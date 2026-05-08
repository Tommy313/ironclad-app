/**
 * Supabase browser client — used in Client Components for auth actions
 * (signIn, signOut, onAuthStateChange, etc.)
 *
 * Uses @supabase/ssr createBrowserClient so cookies are shared with
 * the middleware session on the server side.
 */

import { createBrowserClient } from '@supabase/ssr';

export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
