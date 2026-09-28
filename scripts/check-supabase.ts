// ─────────────────────────────────────────────────────────────────────────
// Supabase connection check — READ ONLY.
//
// Standalone diagnostic: it is NOT imported by the app or the NEXUS server,
// and it never writes, creates or deletes anything. Run it with:
//
//   npx tsx scripts/check-supabase.ts
//
// It reports, in order: which env vars are present, whether the REST, Auth
// and Storage endpoints answer with the anon key, how many users exist
// (service-role only), and which tables already live in the public schema.
// ─────────────────────────────────────────────────────────────────────────

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const ANON = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const ok = (s: string) => console.log(`  \x1b[32m✓\x1b[0m ${s}`);
const bad = (s: string) => console.log(`  \x1b[31m✗\x1b[0m ${s}`);
const info = (s: string) => console.log(`  \x1b[2m·\x1b[0m ${s}`);

/** Never print a key — only prove one is present and well-formed. */
function mask(key: string) {
  if (!key) return 'MISSING';
  return `present (${key.length} chars, ${key.slice(0, 7)}…)`;
}

async function main() {
  console.log('\n\x1b[1mSTENNER OS → Supabase connection check\x1b[0m\n');

  console.log('\x1b[1m1. Environment\x1b[0m');
  URL ? ok(`VITE_SUPABASE_URL = ${URL}`) : bad('VITE_SUPABASE_URL is missing');
  ANON ? ok(`VITE_SUPABASE_ANON_KEY ${mask(ANON)}`) : bad('VITE_SUPABASE_ANON_KEY is missing');
  SERVICE ? ok(`SUPABASE_SERVICE_ROLE_KEY ${mask(SERVICE)}`) : info('SUPABASE_SERVICE_ROLE_KEY not set (optional — needed to list tables/users)');

  if (!URL || !ANON) {
    console.log('\n\x1b[31mCannot continue without URL + anon key.\x1b[0m Add them to .env and re-run.\n');
    process.exit(1);
  }

  const anonClient = createClient(URL, ANON);

  console.log('\n\x1b[1m2. Reachability (anon key)\x1b[0m');
  for (const [label, path] of [
    ['REST  (PostgREST)', '/rest/v1/'],
    ['Auth  (GoTrue)', '/auth/v1/settings'],
    ['Storage', '/storage/v1/bucket'],
  ] as const) {
    try {
      const res = await fetch(`${URL}${path}`, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } });
      res.ok ? ok(`${label} → ${res.status}`) : bad(`${label} → ${res.status} ${res.statusText}`);
    } catch (err) {
      bad(`${label} → unreachable (${(err as Error).message})`);
    }
  }

  console.log('\n\x1b[1m3. Auth configuration\x1b[0m');
  try {
    const res = await fetch(`${URL}/auth/v1/settings`, { headers: { apikey: ANON } });
    const s = (await res.json()) as Record<string, unknown>;
    const providers = Object.entries((s.external ?? {}) as Record<string, boolean>)
      .filter(([, on]) => on)
      .map(([name]) => name);
    info(`email signup: ${s.disable_signup === true ? 'DISABLED' : 'enabled'}`);
    info(`external providers enabled: ${providers.length ? providers.join(', ') : 'none'}`);
  } catch {
    bad('could not read auth settings');
  }

  console.log('\n\x1b[1m4. Existing tables (public schema)\x1b[0m');
  if (!SERVICE) {
    info('skipped — needs SUPABASE_SERVICE_ROLE_KEY');
  } else {
    const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
    // information_schema is not exposed over PostgREST; ask OpenAPI instead,
    // which lists exactly the tables/views PostgREST can see.
    try {
      const res = await fetch(`${URL}/rest/v1/`, { headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` } });
      const spec = (await res.json()) as { definitions?: Record<string, unknown>; paths?: Record<string, unknown> };
      const names = Object.keys(spec.definitions ?? {});
      if (names.length === 0) {
        ok('public schema is EMPTY — no tables yet (nothing of yours can be overwritten)');
      } else {
        ok(`${names.length} table(s)/view(s) found:`);
        for (const n of names.sort()) console.log(`      - ${n}`);
      }
    } catch (err) {
      bad(`could not introspect schema (${(err as Error).message})`);
    }

    const { data, error } = await admin.auth.admin.listUsers();
    if (error) bad(`could not list users (${error.message})`);
    else info(`auth.users: ${data.users.length} user(s)`);
  }

  console.log('\n\x1b[1mDone.\x1b[0m Nothing was written or deleted.\n');
}

main().catch((err) => {
  console.error('\n\x1b[31mCheck failed:\x1b[0m', err);
  process.exit(1);
});
