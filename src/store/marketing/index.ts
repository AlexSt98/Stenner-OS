// ─────────────────────────────────────────────────────────────────────────
// Backend selection.
//
// Supabase is the default whenever credentials are present: the migration
// has been applied (supabase/migrations/20260928140000_marketing_lab.sql),
// so the ml_* tables exist and research persists across devices and browser
// resets.
//
// Two escape hatches, both explicit:
//
//   VITE_MARKETING_BACKEND=local   forces the browser-only adapter, for
//                                  working offline or against a database
//                                  you would rather not touch.
//   no credentials                 falls back to local rather than failing
//                                  to boot, so a fresh clone still runs.
//
// The local adapter keeps its own storage key and never touches
// stenner-os-storage-v1, so the two backends cannot contaminate each other
// or anything else in STENNER OS.
// ─────────────────────────────────────────────────────────────────────────

import { isSupabaseConfigured } from '../../lib/supabase/client';
import { localRepository } from './localRepository';
import { supabaseRepository } from './supabaseRepository';
import type { MarketingRepository } from './repository';

const FORCED = import.meta.env.VITE_MARKETING_BACKEND as string | undefined;

const useLocal = FORCED === 'local' || !isSupabaseConfigured();

export const repository: MarketingRepository = useLocal ? localRepository : supabaseRepository;

/** True when Supabase was wanted but no credentials were found. */
export const missingCredentials = FORCED !== 'local' && !isSupabaseConfigured();

/** True when the local adapter is active because someone asked for it. */
export const forcedLocal = FORCED === 'local';

export type { MarketingRepository } from './repository';
