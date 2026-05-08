/**
 * Supabase browser client — used in Client Components for auth actions
 * (signIn, signOut, onAuthStateChange, etc.)
 *
 * Uses @supabase/ssr createBrowserClient so cookies are shared with
 * the middleware session on the server side.
 */

import { createBrowserClient } from '@supabase/ssr';

// Singleton — one client instance per browser session.
// Avoids unnecessary reconnections and auth listener duplication.
let _client = null;

export function createSupabaseBrowser() {
  if (_client) return _client;
  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  return _client;
}
