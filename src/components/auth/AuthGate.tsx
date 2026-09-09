import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { Button } from '../common/Button';
import { Label, TextInput } from '../common/Fields';
import { MigrationPrompt } from './MigrationPrompt';
import { useStore } from '../../store/useStore';
import { hasPendingLocalData, userHasRemoteData } from '../../lib/supabase/sync';

/**
 * Gates the app behind Supabase Auth ONLY when Supabase is actually
 * configured (VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY set). Until then,
 * STENNER OS behaves exactly as it did before this feature — fully local,
 * no login wall — since "the Supabase user will be configured later" and
 * nothing here hardcodes an email or account.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!isSupabaseConfigured);
  const hydratedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) {
        useStore.getState().stopRealtimeSync();
        hydratedFor.current = null;
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Pull from Supabase + start Realtime once per signed-in session (not on
  // every token refresh). Deliberately SKIPPED when there's pending local
  // data and the Supabase account is still empty — hydrateFromSupabase()
  // replaces the store's state (which the `persist` middleware immediately
  // writes back to localStorage), so running it here first would overwrite
  // the local cache with an empty remote snapshot before the user even sees
  // MigrationPrompt. In that case MigrationPrompt owns the hydrate call,
  // triggered only after a successful import (or never, if the user skips).
  useEffect(() => {
    if (!session || hydratedFor.current === session.user.id) return;
    hydratedFor.current = session.user.id;
    (async () => {
      const pending = hasPendingLocalData();
      const remoteHasData = pending ? await userHasRemoteData() : true;
      if (pending && !remoteHasData) return; // let MigrationPrompt decide
      await useStore.getState().hydrateFromSupabase(session.user.id);
    })();
  }, [session]);

  if (!isSupabaseConfigured) return <>{children}</>;
  if (!ready) return null;
  if (!session) return <LoginScreen />;

  return (
    <>
      <MigrationPrompt userId={session.user.id} />
      {children}
    </>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    const { error: authError } =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (authError) setError(authError.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="stenner-card w-full max-w-sm p-6">
        <h1 className="text-[18px] font-bold mb-1">STENNER OS</h1>
        <p className="text-[12.5px] text-zinc-500 mb-5">
          {mode === 'sign-in' ? 'Sign in to sync your data across devices.' : 'Create an account to enable cloud sync.'}
        </p>

        <div className="space-y-3">
          <div>
            <Label>Email</Label>
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div>
            <Label>Password</Label>
            <TextInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            />
          </div>
        </div>

        {error && <p className="text-[12px] text-red-400 mt-3">{error}</p>}

        <Button variant="primary" className="w-full justify-center mt-4" onClick={submit} disabled={loading || !email || !password}>
          {loading ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Sign up'}
        </Button>

        <button
          className="text-[12px] text-zinc-500 hover:text-zinc-300 mt-3 w-full text-center"
          onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
        >
          {mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
