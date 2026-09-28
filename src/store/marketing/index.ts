// ─────────────────────────────────────────────────────────────────────────
// Backend selection.
//
// The local adapter is the default and the only one reachable right now:
// the Supabase migration has not been applied, so the ml_* tables do not
// exist. Nothing entered in Marketing Lab reaches the database until BOTH
// are true:
//
//   1. supabase/migrations/0001_marketing_lab.sql has been run, and
//   2. VITE_MARKETING_BACKEND=supabase is set.
//
// Requiring the explicit flag — rather than switching automatically the
// moment Supabase credentials appear — is what guarantees that preparing
// the connection can never silently start writing to a database that has
// not been reviewed.
// ─────────────────────────────────────────────────────────────────────────

import { isSupabaseConfigured } from '../../lib/supabase/client';
import { localRepository } from './localRepository';
import { supabaseRepository } from './supabaseRepository';
import type { MarketingRepository } from './repository';

const REQUESTED = (import.meta.env.VITE_MARKETING_BACKEND as string | undefined) ?? 'local';

export const repository: MarketingRepository =
  REQUESTED === 'supabase' && isSupabaseConfigured() ? supabaseRepository : localRepository;

/** True when the flag asked for Supabase but the credentials are missing. */
export const backendFellBack = REQUESTED === 'supabase' && !isSupabaseConfigured();

export type { MarketingRepository } from './repository';
