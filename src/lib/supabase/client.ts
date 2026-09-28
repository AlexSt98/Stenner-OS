// ─────────────────────────────────────────────────────────────────────────
// Supabase browser client.
//
// Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY — both must keep the
// VITE_ prefix, because Vite only exposes prefixed vars to the bundle. That
// is safe by design: the anon key is public and every table is protected by
// row-level security (user_id = auth.uid()).
//
// The service-role key must NEVER be imported here. It bypasses RLS, so it
// belongs only in server/ and scripts/, without a VITE_ prefix.
//
// The client is created lazily and returns null when the vars are absent,
// so a build without Supabase configured still runs — Marketing Lab simply
// stays on the local adapter instead of crashing at import time.
// ─────────────────────────────────────────────────────────────────────────

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let client: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  return Boolean(URL && ANON_KEY);
}

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  client ??= createClient(URL as string, ANON_KEY as string, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return client;
}

/** Throws rather than returning null, for call sites that cannot proceed without it. */
export function requireSupabase(): SupabaseClient {
  const c = getSupabase();
  if (!c) {
    throw new Error('Supabase is not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  return c;
}
