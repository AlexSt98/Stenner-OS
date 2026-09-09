// ─────────────────────────────────────────────────────────────────────────
// Supabase client — the ONLY place VITE_SUPABASE_* env vars are read.
//
// Unlike GEMINI_API_KEY (server-side only, see server/providers), the
// Supabase anon key is DESIGNED to be public and ship in the client bundle —
// it authorizes nothing by itself. Row Level Security (see schema.sql) is
// what actually protects data: every table only lets a row through when
// `user_id = auth.uid()`. Never import the service_role key here or anywhere
// in src/ — that key must never reach the frontend.
// ─────────────────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True once both Supabase env vars are present — mirrors NEXUS's isConfigured() pattern. */
export const isSupabaseConfigured = Boolean(url && anonKey);

// A dummy placeholder client when unconfigured keeps every call site from
// having to null-check — calls simply fail/no-op instead of crashing the
// app, so STENNER OS still works fully offline/local-only if Supabase was
// never set up (no forced migration, per the approved plan).
export const supabase = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : createClient('https://placeholder.invalid', 'placeholder-anon-key');
