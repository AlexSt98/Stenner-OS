// ─────────────────────────────────────────────────────────────────────────
// Auth gate — wraps the /marketing routes only.
//
// Deliberately NOT applied to the whole app. Tasks, Calendar, Time Tracker,
// Boards, Ideas, Projects, TEOPM Workday, English Lab, NEXUS and Stats keep
// working with no account, exactly as before. Only Marketing Lab needs a
// session, because only Marketing Lab has data in Supabase behind RLS.
// ─────────────────────────────────────────────────────────────────────────

import { useState, type ReactNode } from 'react';
import { FlaskConical, LogOut } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase/client';
import { signIn, signOut, signUp, useSession } from '../../lib/supabase/auth';
import { Button } from '../common/Button';
import { Label, TextInput } from '../common/Fields';
import { ErrorState, LoadingState } from './primitives';

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();

  // Without credentials there is nothing to authenticate against. Render the
  // children anyway: the repository falls back to the local adapter, so the
  // module still works, just without persistence to the database.
  if (!isSupabaseConfigured()) return <>{children}</>;

  if (loading) return <LoadingState label="Checking your session…" />;
  if (!session) return <SignInPanel />;

  return <>{children}</>;
}

/** Small sign-out control, shown in the Marketing Lab header. */
export function SessionBadge() {
  const { session } = useSession();
  if (!session) return null;
  return (
    <div className="flex items-center gap-2 text-[11.5px] text-zinc-600">
      <span className="truncate max-w-[180px]">{session.user.email}</span>
      <button
        onClick={() => void signOut()}
        className="p-1 rounded-md hover:bg-white/[0.06] hover:text-zinc-300 transition-colors"
        title="Sign out"
      >
        <LogOut size={13} />
      </button>
    </div>
  );
}

function SignInPanel() {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !email.trim() || !password) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === 'in') {
        await signIn(email.trim(), password);
      } else {
        const { needsConfirmation } = await signUp(email.trim(), password);
        if (needsConfirmation) {
          setNotice('Account created. Check your inbox for the confirmation link, then sign in.');
          setMode('in');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
      setPassword('');
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-16">
      <div className="stenner-card p-6">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
            <FlaskConical size={15} className="text-violet-300" />
          </div>
          <h1 className="text-[16px] font-bold">Marketing Lab</h1>
        </div>
        <p className="text-[12px] text-zinc-500 leading-relaxed mb-5">
          Your research is stored in Supabase and protected by row-level security, so it needs a sign-in. The rest of
          STENNER OS keeps working without one.
        </p>

        <form onSubmit={submit} className="space-y-3.5">
          <div>
            <Label>Email</Label>
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
            />
          </div>
          <div>
            <Label>Password</Label>
            <TextInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-500/[0.08] border border-red-500/20 text-[12px] text-red-300 leading-relaxed">
              {error}
            </div>
          )}
          {notice && (
            <div className="px-3 py-2 rounded-lg bg-green-500/[0.08] border border-green-500/20 text-[12px] text-green-300 leading-relaxed">
              {notice}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full justify-center"
            disabled={busy || !email.trim() || !password}
          >
            {busy ? 'Working…' : mode === 'in' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <button
          onClick={() => {
            setMode((m) => (m === 'in' ? 'up' : 'in'));
            setError(null);
            setNotice(null);
          }}
          className="w-full text-center text-[11.5px] text-zinc-600 hover:text-violet-300 transition-colors mt-3.5"
        >
          {mode === 'in' ? 'No account yet? Create one' : 'Already have an account? Sign in'}
        </button>
      </div>

      <p className="text-[11px] text-zinc-700 text-center mt-3 leading-relaxed">
        Once your account exists, disable signups in the Supabase dashboard — the anon key is public, so an open signup
        endpoint lets anyone register on this project.
      </p>
    </div>
  );
}

/** Rendered when Supabase credentials are missing entirely. */
export function MissingCredentials() {
  return <ErrorState message="VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not set — Marketing Lab cannot reach the database." />;
}
