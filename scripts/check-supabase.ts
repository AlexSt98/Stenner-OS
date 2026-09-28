// ─────────────────────────────────────────────────────────────────────────
// Supabase connection check — STRICTLY READ ONLY.
//
// Standalone diagnostic: it is NOT imported by the app or the NEXUS server,
// and it issues nothing but GET / SELECT. It never creates, updates, deletes
// or migrates anything. Run it with:
//
//   npm run check:supabase
//
// It never prints the VALUE of any environment variable — not the URL, not
// the anon key, not the service-role key. Only whether each one is present
// and well-formed. Table names ARE printed, since discovering the existing
// schema is the whole point.
// ─────────────────────────────────────────────────────────────────────────

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// .env is the local source of truth; .env.local is what `vercel env pull`
// writes, so support both. Neither overrides a var already in the shell.
config({ path: '.env' });
config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const ANON = process.env.VITE_SUPABASE_ANON_KEY ?? '';
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const ok = (s: string) => console.log(`  \x1b[32m✓\x1b[0m ${s}`);
const bad = (s: string) => console.log(`  \x1b[31m✗\x1b[0m ${s}`);
const warn = (s: string) => console.log(`  \x1b[33m!\x1b[0m ${s}`);
const info = (s: string) => console.log(`  \x1b[2m·\x1b[0m ${s}`);

/** Proves a key exists and has the right shape WITHOUT revealing it. */
function describeKey(key: string) {
  if (!key) return 'missing';
  const looksJwt = key.startsWith('eyJ');
  const looksNewStyle = /^sb_(publishable|secret)_/.test(key);
  const shape = looksJwt ? 'JWT format' : looksNewStyle ? 'sb_ format' : '\x1b[33munrecognized format\x1b[0m';
  return `present, ${key.length} chars, ${shape}`;
}

/** Same idea for the URL: validate its shape, print none of it. */
function describeUrl(raw: string) {
  if (!raw) return 'missing';
  try {
    const u = new URL(raw);
    const ref = u.hostname.split('.')[0];
    const host = u.hostname.endsWith('.supabase.co') ? 'supabase.co host' : `\x1b[33mnon-supabase host\x1b[0m`;
    const refShape = /^[a-z]{20}$/.test(ref) ? 'project ref well-formed' : '\x1b[33mproject ref looks unusual\x1b[0m';
    const proto = u.protocol === 'https:' ? 'https' : `\x1b[31m${u.protocol}\x1b[0m`;
    return `present, ${proto}, ${host}, ${refShape}`;
  } catch {
    return '\x1b[31mnot a valid URL\x1b[0m';
  }
}

/**
 * information_schema is not exposed over PostgREST, but its OpenAPI spec
 * lists exactly the tables and views the given role is allowed to see.
 */
async function tablesFor(key: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const spec = (await res.json()) as { definitions?: Record<string, unknown> };
  return Object.keys(spec.definitions ?? {}).sort();
}

async function main() {
  console.log('\n\x1b[1mSTENNER OS → Supabase connection check\x1b[0m');
  console.log('\x1b[2mRead-only. No secret values are printed. Nothing is written.\x1b[0m\n');

  console.log('\x1b[1m1. Environment\x1b[0m');
  if (SUPABASE_URL) ok(`VITE_SUPABASE_URL — ${describeUrl(SUPABASE_URL)}`);
  else bad('VITE_SUPABASE_URL is missing');

  if (ANON) ok(`VITE_SUPABASE_ANON_KEY — ${describeKey(ANON)}`);
  else bad('VITE_SUPABASE_ANON_KEY is missing');

  if (SERVICE) ok(`SUPABASE_SERVICE_ROLE_KEY — ${describeKey(SERVICE)}`);
  else info('SUPABASE_SERVICE_ROLE_KEY not set (optional — needed to list tables and users)');

  if (ANON && SERVICE && ANON === SERVICE) {
    bad('anon key and service-role key are IDENTICAL — one of them is pasted wrong');
  }

  if (!SUPABASE_URL || !ANON) {
    console.log('\n\x1b[31mCannot continue without URL + anon key.\x1b[0m Add them to .env and re-run.\n');
    process.exit(1);
  }

  console.log('\n\x1b[1m2. Reachability\x1b[0m');

  // PostgREST needs a different probe from the other two services. Its root
  // (/rest/v1/, the OpenAPI spec) is restricted to service_role — an anon key
  // there returns 401 "Only the `service_role` API key can be used for this
  // endpoint", which says nothing about whether the anon key is valid. So we
  // query a table that deliberately does not exist: PostgREST only reaches
  // the schema lookup once the key has been accepted, meaning 404/PGRST205
  // proves authentication succeeded, while 401 is a genuinely bad key.
  let restOk = false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/_connection_probe_?select=*&limit=1`, {
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
    });
    if (res.status === 401) {
      bad('REST    (PostgREST) → 401 — anon key rejected: wrong, expired, or from another project');
    } else if (res.status === 404 || res.ok) {
      ok(`REST    (PostgREST) → ${res.status} — anon key accepted`);
      restOk = true;
    } else {
      warn(`REST    (PostgREST) → ${res.status} ${res.statusText}`);
      restOk = true;
    }
  } catch (err) {
    bad(`REST    (PostgREST) → unreachable (${(err as Error).message})`);
  }

  for (const [label, path] of [
    ['Auth    (GoTrue)', '/auth/v1/settings'],
    ['Storage', '/storage/v1/bucket'],
  ] as const) {
    try {
      const res = await fetch(`${SUPABASE_URL}${path}`, {
        headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
      });
      if (res.ok) ok(`${label} → ${res.status}`);
      else if (res.status === 401) bad(`${label} → 401 — anon key rejected`);
      else warn(`${label} → ${res.status} ${res.statusText}`);
    } catch (err) {
      bad(`${label} → unreachable (${(err as Error).message})`);
    }
  }

  if (!restOk) {
    console.log('\n\x1b[31mREST is not answering with this anon key. Stopping here.\x1b[0m\n');
    process.exit(1);
  }

  console.log('\n\x1b[1m3. Auth configuration\x1b[0m');
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: ANON } });
    const s = (await res.json()) as Record<string, unknown>;
    const providers = Object.entries((s.external ?? {}) as Record<string, boolean>)
      .filter(([, on]) => on)
      .map(([name]) => name);
    info(`email signup: ${s.disable_signup === true ? 'disabled' : 'enabled'}`);
    info(`email confirmation: ${s.mailer_autoconfirm === true ? 'auto-confirmed' : 'required'}`);
    info(`external providers: ${providers.length ? providers.join(', ') : 'none'}`);
  } catch {
    bad('could not read auth settings');
  }

  console.log('\n\x1b[1m4. Existing tables (public schema)\x1b[0m');
  let tables: string[] = [];
  try {
    if (SERVICE) {
      tables = await tablesFor(SERVICE);
      if (tables.length === 0) {
        ok('public schema is EMPTY — no tables yet, so nothing of yours can be overwritten');
      } else {
        ok(`${tables.length} table(s)/view(s):`);
        for (const t of tables) console.log(`      - ${t}`);
      }
    } else {
      // Without the service-role key the schema cannot be listed at all:
      // /rest/v1/ rejects every other key by design.
      info('service-role key not set — the schema cannot be listed (that endpoint is service_role only)');
    }
  } catch (err) {
    bad(`could not introspect schema (${(err as Error).message})`);
  }

  // ── RLS audit ────────────────────────────────────────────────────────
  // The anon key ships inside the public JS bundle, so anything an
  // unauthenticated caller can read is readable by anyone on the internet.
  //
  // The test compares what anon sees against what service_role sees. That
  // comparison matters: with RLS ON and no anon policy, PostgREST answers
  // 200 with zero rows — it does NOT return an error. So "no error" alone
  // proves nothing, and an earlier version of this check wrongly reported
  // every protected-but-empty table as exposed.
  //
  //   anon sees rows          → EXPOSED, unambiguously
  //   anon 0 / service_role N → PROTECTED, proven by the difference
  //   both 0 (empty table)    → INCONCLUSIVE from outside, and said so
  //
  // SELECT with head only: no rows are fetched and nothing is written.
  console.log('\n\x1b[1m5. RLS audit (anon vs service_role)\x1b[0m');
  if (tables.length === 0) {
    info('no tables to audit');
  } else {
    const anonClient = createClient(SUPABASE_URL, ANON, { auth: { persistSession: false } });
    const adminClient = SERVICE ? createClient(SUPABASE_URL, SERVICE, { auth: { persistSession: false } }) : null;

    const exposed: string[] = [];
    let inconclusive = 0;

    for (const table of tables) {
      const anonResult = await anonClient.from(table).select('*', { count: 'exact', head: true });
      const adminCount = adminClient
        ? (await adminClient.from(table).select('*', { count: 'exact', head: true })).count ?? 0
        : null;

      if (anonResult.error) {
        // An explicit refusal is the strongest possible signal.
        ok(`${table} — protected (anon refused)`);
        continue;
      }

      const anonCount = anonResult.count ?? 0;
      if (anonCount > 0) {
        exposed.push(table);
        bad(`${table} — EXPOSED: anon can read ${anonCount} row(s)`);
      } else if (adminCount !== null && adminCount > 0) {
        ok(`${table} — protected (anon 0 of ${adminCount} rows)`);
      } else {
        inconclusive += 1;
        info(`${table} — empty; anon sees nothing, but an empty table cannot prove RLS either way`);
      }
    }

    if (exposed.length > 0) {
      console.log(`\n  \x1b[31m${exposed.length} table(s) are world-readable.\x1b[0m The anon key is public by design,`);
      console.log('  so anyone who opens DevTools on the deployed app can read this data.');
    }
    if (inconclusive > 0) {
      console.log(
        `\n  \x1b[2m${inconclusive} table(s) are empty, so this check cannot confirm RLS from the client.\x1b[0m`
      );
      console.log('  \x1b[2mRe-run once there is data, or verify the policies in the dashboard.\x1b[0m');
    }
  }

  console.log('\n\x1b[1m6. Users\x1b[0m');
  if (!SERVICE) {
    info('skipped — needs SUPABASE_SERVICE_ROLE_KEY');
  } else {
    const admin = createClient(SUPABASE_URL, SERVICE, { auth: { persistSession: false } });
    const { data, error } = await admin.auth.admin.listUsers();
    if (error) bad(`could not list users (${error.message})`);
    else info(`auth.users: ${data.users.length} user(s)`);
  }

  console.log('\n\x1b[1mDone.\x1b[0m Nothing was created, written or deleted.\n');
}

main().catch((err) => {
  console.error('\n\x1b[31mCheck failed:\x1b[0m', err);
  process.exit(1);
});
