// ─────────────────────────────────────────────────────────────────────────
// Supabase auth — used ONLY by Marketing Lab.
//
// The rest of STENNER OS stays exactly as it was: no account, no login,
// LocalStorage. Marketing Lab needs a session for one concrete reason —
// every ml_* table's RLS policy is `user_id = auth.uid()` granted to
// `authenticated`, so an unauthenticated caller matches no policy and sees
// nothing. The login is what makes the data reachable, and simultaneously
// what keeps it private: the anon key ships in the public bundle, so RLS is
// the only thing standing between this research and the internet.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from './client';

export interface AuthState {
  session: Session | null;
  /** Still resolving the stored session on first paint. */
  loading: boolean;
}

/**
 * Subscribes to the Supabase session. Returns `loading: false` immediately
 * when Supabase is not configured, so a build without credentials renders
 * the fallback instead of hanging on a spinner forever.
 */
export function useSession(): AuthState {
  const [state, setState] = useState<AuthState>({ session: null, loading: isSupabaseConfigured() });

  useEffect(() => {
    const supabase = getSupabase();
    // Nothing to subscribe to. The initial state already reports
    // `loading: false` in this case, so there is nothing to set either.
    if (!supabase) return;

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) setState({ session: data.session, loading: false });
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setState({ session, loading: false });
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export async function signIn(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

/**
 * Sign-up stays available because the project starts with zero users and
 * someone has to create the first account. Once yours exists, disable
 * signups in the dashboard (Authentication → Providers → Email) — with the
 * anon key public, an open signup endpoint lets anyone create an account on
 * this project.
 */
export async function signUp(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  // With email confirmation on, no session comes back until the link is clicked.
  return { needsConfirmation: data.session === null };
}

export async function signOut() {
  await getSupabase()?.auth.signOut();
}
