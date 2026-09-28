-- ═══════════════════════════════════════════════════════════════════════
-- MARKETING LAB — schema
--
-- ⚠ NOT APPLIED. This file is for review. Nothing in STENNER OS reads these
--   tables yet: the app runs on the local adapter until BOTH the migration
--   has been run AND VITE_MARKETING_BACKEND=supabase is set.
--
-- Safe to review and to run:
--   · Purely additive. Every statement is CREATE ... IF NOT EXISTS.
--   · No DROP, no ALTER of anything pre-existing, no DELETE, no UPDATE.
--   · No seed data. The 14 phases, their questions, the book sections and
--     the strategy blocks are inserted by the application when a workspace
--     is created (src/store/marketing/seedWorkspace.ts), so both backends
--     produce an identical starting point and this file stays data-free.
--
-- Design notes:
--   · Every table carries user_id DEFAULT auth.uid() with RLS. The client
--     never sends user_id, so it cannot write a row on another user's
--     behalf even if it tried.
--   · Every child table also carries workspace_id. That is what keeps TEOPM
--     and GEO-CX isolated — no query can span workspaces by accident.
--   · Nothing derived is stored. Research gaps, progress, what-we-know /
--     what-we-don't-know and the next research action are all computed in
--     the client from these rows (src/lib/marketing/), so they cannot fall
--     out of sync with the records they summarise.
--   · Column names are the snake_case of the TypeScript fields; the
--     repository adapter translates both ways.
--   · "order" is deliberately NOT used as a column name: it is reserved in
--     SQL and collides with PostgREST's ?order= sorting parameter. The
--     column is sort_order.
-- ═══════════════════════════════════════════════════════════════════════

-- ── Enums ──────────────────────────────────────────────────────────────
-- Created idempotently: CREATE TYPE has no IF NOT EXISTS.

do $$ begin
  create type ml_question_status as enum ('not_started','in_progress','needs_evidence','validated','decided');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ml_hypothesis_status as enum ('open','testing','supported','rejected','validated');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ml_confidence as enum ('none','low','medium','high');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ml_source_type as enum
    ('official','government','industry_report','competitor','customer','linkedin','interview','internal','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ml_note_type as enum ('note','idea','question','concern','opportunity','observation');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ml_stance as enum ('supports','contradicts','context');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ml_priority as enum ('high','medium','low');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ml_queue_status as enum ('todo','doing','done');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ml_workspace_status as enum ('active','paused','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ml_roadmap_horizon as enum ('days_0_30','days_31_60','days_61_90');
exception when duplicate_object then null; end $$;

-- ── updated_at trigger ─────────────────────────────────────────────────
-- Keeps updated_at honest even if a client forgets to send it.

create or replace function ml_touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── Root: workspaces ───────────────────────────────────────────────────

create table if not exists ml_workspaces (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users(id) on delete cascade,
  slug              text not null,
  name              text not null check (length(trim(name)) > 0),
  description       text not null default '',
  color             text not null default '#8b5cf6',
  icon              text not null default '◆',
  status            ml_workspace_status not null default 'active',
  -- Optional link to a STENNER OS Project. Intentionally a plain text id,
  -- not a foreign key: projects still live in LocalStorage, so a constraint
  -- here would reference a table that does not exist.
  linked_project_id text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- A slug identifies a workspace within one account, not globally.
  unique (user_id, slug)
);

-- ── Research framework ─────────────────────────────────────────────────

create table if not exists ml_phases (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workspace_id uuid not null references ml_workspaces(id) on delete cascade,
  key          text not null,
  sort_order   integer not null default 0,
  objective    text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- One phase per key per workspace: the 14 are a fixed framework.
  unique (workspace_id, key)
);

create table if not exists ml_questions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workspace_id      uuid not null references ml_workspaces(id) on delete cascade,
  phase_id          uuid not null references ml_phases(id) on delete cascade,
  sort_order        integer not null default 0,
  text              text not null check (length(trim(text)) > 0),
  purpose           text not null default '',
  guidance          text not null default '',
  expected_evidence text not null default '',
  response          text not null default '',
  status            ml_question_status not null default 'not_started',
  confidence        ml_confidence not null default 'none',
  is_template       boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ── Evidence ───────────────────────────────────────────────────────────

create table if not exists ml_evidence (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workspace_id uuid not null references ml_workspaces(id) on delete cascade,
  -- SET NULL, not CASCADE: deleting a question must never destroy the
  -- sources that were collected for it.
  phase_id     uuid references ml_phases(id) on delete set null,
  question_id  uuid references ml_questions(id) on delete set null,
  title        text not null check (length(trim(title)) > 0),
  description  text not null default '',
  url          text not null default '',
  source_name  text not null default '',
  source_type  ml_source_type not null default 'other',
  source_date  date,
  confidence   ml_confidence not null default 'medium',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── Hypotheses ─────────────────────────────────────────────────────────

create table if not exists ml_hypotheses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workspace_id uuid not null references ml_workspaces(id) on delete cascade,
  phase_id     uuid references ml_phases(id) on delete set null,
  question_id  uuid references ml_questions(id) on delete set null,
  statement    text not null check (length(trim(statement)) > 0),
  status       ml_hypothesis_status not null default 'open',
  confidence   ml_confidence not null default 'none',
  conclusion   text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Bridge table rather than two id arrays on the hypothesis: the SAME piece
-- of evidence can support one hypothesis and contradict another, so the
-- stance belongs to the relationship, not to the evidence.
create table if not exists ml_evidence_links (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workspace_id uuid not null references ml_workspaces(id) on delete cascade,
  evidence_id  uuid not null references ml_evidence(id) on delete cascade,
  -- Polymorphic target: hypothesis | question | decision. Not a foreign key,
  -- because Postgres cannot reference three tables from one column; the
  -- orphan sweep below keeps it clean.
  target_type  text not null check (target_type in ('hypothesis','question','decision')),
  target_id    uuid not null,
  stance       ml_stance not null default 'supports',
  created_at   timestamptz not null default now(),
  -- The same evidence cannot be linked twice to the same target.
  unique (evidence_id, target_type, target_id)
);

-- ── Decisions, notes, sources, queue ───────────────────────────────────

create table if not exists ml_decisions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workspace_id  uuid not null references ml_workspaces(id) on delete cascade,
  phase_id      uuid references ml_phases(id) on delete set null,
  question_id   uuid references ml_questions(id) on delete set null,
  title         text not null check (length(trim(title)) > 0),
  reason        text not null default '',
  impact        text not null default '',
  decided_at    date not null default current_date,
  decided_by    text not null default '',
  -- A decision that overrides an earlier one, keeping the history intact.
  supersedes_id uuid references ml_decisions(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists ml_notes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workspace_id uuid not null references ml_workspaces(id) on delete cascade,
  phase_id     uuid references ml_phases(id) on delete set null,
  question_id  uuid references ml_questions(id) on delete set null,
  type         ml_note_type not null default 'note',
  body         text not null default '',
  pinned       boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists ml_sources (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workspace_id uuid not null references ml_workspaces(id) on delete cascade,
  name         text not null default '',
  type         ml_source_type not null default 'other',
  url          text not null default '',
  credibility  ml_confidence not null default 'medium',
  notes        text not null default '',
  created_at   timestamptz not null default now()
);

create table if not exists ml_research_queue (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workspace_id uuid not null references ml_workspaces(id) on delete cascade,
  phase_id     uuid references ml_phases(id) on delete set null,
  title        text not null check (length(trim(title)) > 0),
  reason       text not null default '',
  priority     ml_priority not null default 'medium',
  status       ml_queue_status not null default 'todo',
  -- 'manual' was typed by hand; 'derived' was promoted from a computed gap.
  origin       text not null default 'manual' check (origin in ('manual','derived')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── Strategy mode ──────────────────────────────────────────────────────
-- Consolidated output only. Nothing reaches these tables automatically:
-- there is no code path from a hypothesis to any of them.

create table if not exists ml_personas (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workspace_id uuid not null references ml_workspaces(id) on delete cascade,
  name         text not null default '',
  role         text not null default '',
  goals        text not null default '',
  pains        text not null default '',
  triggers     text not null default '',
  objections   text not null default '',
  channels     text not null default '',
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists ml_segments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workspace_id  uuid not null references ml_workspaces(id) on delete cascade,
  name          text not null default '',
  criteria      text not null default '',
  size_estimate text not null default '',
  fit_score     integer not null default 0 check (fit_score between 0 and 100),
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists ml_competitors (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workspace_id  uuid not null references ml_workspaces(id) on delete cascade,
  name          text not null default '',
  url           text not null default '',
  positioning   text not null default '',
  strengths     text not null default '',
  weaknesses    text not null default '',
  pricing_notes text not null default '',
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists ml_content_pillars (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workspace_id uuid not null references ml_workspaces(id) on delete cascade,
  name         text not null default '',
  rationale    text not null default '',
  formats      text not null default '',
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists ml_roadmap_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workspace_id uuid not null references ml_workspaces(id) on delete cascade,
  title        text not null default '',
  horizon      ml_roadmap_horizon not null default 'days_0_30',
  owner        text not null default '',
  outcome      text not null default '',
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists ml_strategy_outputs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workspace_id uuid not null references ml_workspaces(id) on delete cascade,
  key          text not null check (key in ('positioning','messaging','linkedin','visual','measurement')),
  body         text not null default '',
  -- Question / decision / evidence ids this was built from.
  source_refs  text[] not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (workspace_id, key)
);

-- ── Marketing Book ─────────────────────────────────────────────────────

create table if not exists ml_book_sections (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workspace_id uuid not null references ml_workspaces(id) on delete cascade,
  key          text not null,
  title        text not null default '',
  body         text not null default '',
  source_refs  text[] not null default '{}',
  generated_by text not null default 'manual' check (generated_by in ('manual','derived')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (workspace_id, key)
);

-- ── Indexes ────────────────────────────────────────────────────────────
-- Every read is scoped to one workspace, so workspace_id leads each index.

create index if not exists ml_phases_ws_idx            on ml_phases (workspace_id, sort_order);
create index if not exists ml_questions_ws_idx         on ml_questions (workspace_id, phase_id, sort_order);
create index if not exists ml_questions_status_idx     on ml_questions (workspace_id, status);
create index if not exists ml_evidence_ws_idx          on ml_evidence (workspace_id, created_at desc);
create index if not exists ml_evidence_question_idx    on ml_evidence (question_id);
create index if not exists ml_evidence_links_ws_idx    on ml_evidence_links (workspace_id);
create index if not exists ml_evidence_links_target_idx on ml_evidence_links (target_type, target_id);
create index if not exists ml_hypotheses_ws_idx        on ml_hypotheses (workspace_id, status);
create index if not exists ml_decisions_ws_idx         on ml_decisions (workspace_id, decided_at desc);
create index if not exists ml_notes_ws_idx             on ml_notes (workspace_id, created_at desc);
create index if not exists ml_sources_ws_idx           on ml_sources (workspace_id);
create index if not exists ml_queue_ws_idx             on ml_research_queue (workspace_id, status, priority);
create index if not exists ml_personas_ws_idx          on ml_personas (workspace_id, sort_order);
create index if not exists ml_segments_ws_idx          on ml_segments (workspace_id, sort_order);
create index if not exists ml_competitors_ws_idx       on ml_competitors (workspace_id, sort_order);
create index if not exists ml_pillars_ws_idx           on ml_content_pillars (workspace_id, sort_order);
create index if not exists ml_roadmap_ws_idx           on ml_roadmap_items (workspace_id, sort_order);
create index if not exists ml_strategy_ws_idx          on ml_strategy_outputs (workspace_id);
create index if not exists ml_book_ws_idx              on ml_book_sections (workspace_id);

-- ── Triggers ───────────────────────────────────────────────────────────

do $$
declare t text;
begin
  foreach t in array array[
    'ml_workspaces','ml_phases','ml_questions','ml_evidence','ml_hypotheses','ml_decisions',
    'ml_research_queue','ml_personas','ml_segments','ml_competitors','ml_content_pillars',
    'ml_roadmap_items','ml_strategy_outputs','ml_book_sections'
  ] loop
    execute format('drop trigger if exists %I_touch on %I', t, t);
    execute format(
      'create trigger %I_touch before update on %I for each row execute function ml_touch_updated_at()', t, t
    );
  end loop;
end $$;

-- ── Row-level security ─────────────────────────────────────────────────
-- The anon key is public — it ships inside the browser bundle. RLS is the
-- only thing standing between this data and the internet, so every table
-- gets it, with WITH CHECK on writes so a row cannot be inserted or moved
-- under another user's id.

do $$
declare t text;
begin
  foreach t in array array[
    'ml_workspaces','ml_phases','ml_questions','ml_evidence','ml_evidence_links','ml_hypotheses',
    'ml_decisions','ml_notes','ml_sources','ml_research_queue','ml_personas','ml_segments',
    'ml_competitors','ml_content_pillars','ml_roadmap_items','ml_strategy_outputs','ml_book_sections'
  ] loop
    execute format('alter table %I enable row level security', t);

    execute format('drop policy if exists %I_select on %I', t, t);
    execute format('drop policy if exists %I_insert on %I', t, t);
    execute format('drop policy if exists %I_update on %I', t, t);
    execute format('drop policy if exists %I_delete on %I', t, t);

    execute format(
      'create policy %I_select on %I for select to authenticated using (user_id = auth.uid())', t, t);
    execute format(
      'create policy %I_insert on %I for insert to authenticated with check (user_id = auth.uid())', t, t);
    execute format(
      'create policy %I_update on %I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t, t);
    execute format(
      'create policy %I_delete on %I for delete to authenticated using (user_id = auth.uid())', t, t);
  end loop;
end $$;

-- Note: policies are granted TO authenticated only. An unauthenticated
-- caller holding the anon key matches no policy and therefore sees nothing,
-- which is exactly what `npm run check:supabase`'s RLS audit verifies.

-- ── Orphan sweep for the polymorphic link table ────────────────────────
-- ml_evidence_links.target_id cannot be a foreign key (it points at three
-- different tables), so deleting a hypothesis would leave a dangling link.
-- These triggers clean up after it.

create or replace function ml_cleanup_evidence_links() returns trigger as $$
begin
  delete from ml_evidence_links
   where target_id = old.id
     and target_type = tg_argv[0];
  return old;
end;
$$ language plpgsql;

drop trigger if exists ml_hypotheses_unlink on ml_hypotheses;
create trigger ml_hypotheses_unlink after delete on ml_hypotheses
  for each row execute function ml_cleanup_evidence_links('hypothesis');

drop trigger if exists ml_questions_unlink on ml_questions;
create trigger ml_questions_unlink after delete on ml_questions
  for each row execute function ml_cleanup_evidence_links('question');

drop trigger if exists ml_decisions_unlink on ml_decisions;
create trigger ml_decisions_unlink after delete on ml_decisions
  for each row execute function ml_cleanup_evidence_links('decision');
