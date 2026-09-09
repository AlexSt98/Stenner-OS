-- ─────────────────────────────────────────────────────────────────────────
-- STENNER OS — Supabase schema (PostgreSQL)
--
-- Run this once in the Supabase SQL editor for a fresh project. Every table
-- carries user_id + RLS so a user only ever sees their own rows — no table
-- is left without a policy.
--
-- IMPORTANT — Task/CalendarEvent independence (see src/types/index.ts):
-- calendar_events.task_id is an OPTIONAL, manually-set link only. Nothing
-- here (trigger, view, function) ever creates a calendar_events row from a
-- tasks row automatically — TEOPM tasks in particular must never appear on
-- the calendar unless the user explicitly used "Add to Calendar".
-- ─────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto; -- gen_random_uuid()

-- Shared "touch updated_at" trigger, reused by every table that has one.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── projects ────────────────────────────────────────────────────────────
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  status text not null default 'Active',
  color text not null default '#8b5cf6',
  icon text,
  created_at timestamptz not null default now()
);
alter table public.projects enable row level security;
create policy "projects: select own" on public.projects for select using (user_id = auth.uid());
create policy "projects: insert own" on public.projects for insert with check (user_id = auth.uid());
create policy "projects: update own" on public.projects for update using (user_id = auth.uid());
create policy "projects: delete own" on public.projects for delete using (user_id = auth.uid());

-- ── tasks (TEOPM tasks are plain tasks tagged TEOPM/WORK — no separate table) ──
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text not null default '',
  category text not null default 'General',
  priority text not null default 'Medium',
  status text not null default 'To Do',
  due_date date,
  due_time text, -- HH:mm
  end_time text, -- HH:mm
  estimated_minutes integer not null default 30,
  actual_minutes integer not null default 0,
  duration_minutes integer, -- derived client-side from due_time/end_time, stored for querying
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.tasks enable row level security;
create policy "tasks: select own" on public.tasks for select using (user_id = auth.uid());
create policy "tasks: insert own" on public.tasks for insert with check (user_id = auth.uid());
create policy "tasks: update own" on public.tasks for update using (user_id = auth.uid());
create policy "tasks: delete own" on public.tasks for delete using (user_id = auth.uid());
create trigger tasks_set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- ── calendar_events — independent of tasks; task_id is an optional manual link ──
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  date date not null,
  start_time text not null,
  end_time text not null,
  color text not null default '#8b5cf6',
  task_id uuid references public.tasks(id) on delete set null, -- optional, manual only
  project_id uuid references public.projects(id) on delete set null,
  location text,
  source text not null default 'local' -- 'local' | 'google'
);
alter table public.calendar_events enable row level security;
create policy "calendar_events: select own" on public.calendar_events for select using (user_id = auth.uid());
create policy "calendar_events: insert own" on public.calendar_events for insert with check (user_id = auth.uid());
create policy "calendar_events: update own" on public.calendar_events for update using (user_id = auth.uid());
create policy "calendar_events: delete own" on public.calendar_events for delete using (user_id = auth.uid());

-- ── time_sessions ───────────────────────────────────────────────────────
create table if not exists public.time_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  category text not null default 'General',
  label text not null default '',
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer not null default 0,
  date date not null
);
alter table public.time_sessions enable row level security;
create policy "time_sessions: select own" on public.time_sessions for select using (user_id = auth.uid());
create policy "time_sessions: insert own" on public.time_sessions for insert with check (user_id = auth.uid());
create policy "time_sessions: update own" on public.time_sessions for update using (user_id = auth.uid());
create policy "time_sessions: delete own" on public.time_sessions for delete using (user_id = auth.uid());

-- ── ideas ───────────────────────────────────────────────────────────────
create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  tags text[] not null default '{}',
  image_url text,
  url text,
  date date not null default current_date,
  converted_to_type text, -- 'task' | 'project' | 'board'
  converted_to_id uuid
);
alter table public.ideas enable row level security;
create policy "ideas: select own" on public.ideas for select using (user_id = auth.uid());
create policy "ideas: insert own" on public.ideas for insert with check (user_id = auth.uid());
create policy "ideas: update own" on public.ideas for update using (user_id = auth.uid());
create policy "ideas: delete own" on public.ideas for delete using (user_id = auth.uid());

-- ── boards / board_items (STENNER OS's "Notes") ────────────────────────
create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);
alter table public.boards enable row level security;
create policy "boards: select own" on public.boards for select using (user_id = auth.uid());
create policy "boards: insert own" on public.boards for insert with check (user_id = auth.uid());
create policy "boards: update own" on public.boards for update using (user_id = auth.uid());
create policy "boards: delete own" on public.boards for delete using (user_id = auth.uid());

create table if not exists public.board_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  board_id uuid not null references public.boards(id) on delete cascade,
  type text not null default 'sticky',
  content text not null default '',
  x double precision not null default 80,
  y double precision not null default 80,
  w double precision not null default 180,
  h double precision not null default 100,
  color text not null default '#8b5cf6',
  rotation double precision not null default 0
);
alter table public.board_items enable row level security;
create policy "board_items: select own" on public.board_items for select using (user_id = auth.uid());
create policy "board_items: insert own" on public.board_items for insert with check (user_id = auth.uid());
create policy "board_items: update own" on public.board_items for update using (user_id = auth.uid());
create policy "board_items: delete own" on public.board_items for delete using (user_id = auth.uid());

-- ── activities (activity feed) ─────────────────────────────────────────
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  message text not null,
  meta jsonb,
  "timestamp" timestamptz not null default now()
);
alter table public.activities enable row level security;
create policy "activities: select own" on public.activities for select using (user_id = auth.uid());
create policy "activities: insert own" on public.activities for insert with check (user_id = auth.uid());
create policy "activities: update own" on public.activities for update using (user_id = auth.uid());
create policy "activities: delete own" on public.activities for delete using (user_id = auth.uid());

-- ── user_settings (one row per user) ───────────────────────────────────
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  role text not null default '',
  avatar_emoji text not null default '🧑‍💻',
  xp integer not null default 0,
  streak integer not null default 0,
  last_active_date date,
  daily_focus_goal_minutes integer not null default 480,
  theme text not null default 'dark',
  integrations jsonb not null default '{"googleCalendar":{"connected":false},"googleDrive":{"connected":false},"gmail":{"connected":false}}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.user_settings enable row level security;
create policy "user_settings: select own" on public.user_settings for select using (user_id = auth.uid());
create policy "user_settings: insert own" on public.user_settings for insert with check (user_id = auth.uid());
create policy "user_settings: update own" on public.user_settings for update using (user_id = auth.uid());
create policy "user_settings: delete own" on public.user_settings for delete using (user_id = auth.uid());
create trigger user_settings_set_updated_at before update on public.user_settings
  for each row execute function public.set_updated_at();

-- ── english_sessions / english_stats ────────────────────────────────────
create table if not exists public.english_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  mode text not null,
  exercise_ids text[] not null default '{}',
  answers jsonb not null default '[]'::jsonb,
  score integer not null default 0,
  xp_earned integer not null default 0,
  completed_at timestamptz not null default now()
);
alter table public.english_sessions enable row level security;
create policy "english_sessions: select own" on public.english_sessions for select using (user_id = auth.uid());
create policy "english_sessions: insert own" on public.english_sessions for insert with check (user_id = auth.uid());
create policy "english_sessions: update own" on public.english_sessions for update using (user_id = auth.uid());
create policy "english_sessions: delete own" on public.english_sessions for delete using (user_id = auth.uid());

create table if not exists public.english_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  streak integer not null default 0,
  last_practice_date date
);
alter table public.english_stats enable row level security;
create policy "english_stats: select own" on public.english_stats for select using (user_id = auth.uid());
create policy "english_stats: insert own" on public.english_stats for insert with check (user_id = auth.uid());
create policy "english_stats: update own" on public.english_stats for update using (user_id = auth.uid());
create policy "english_stats: delete own" on public.english_stats for delete using (user_id = auth.uid());

-- ── nexus_conversations / nexus_messages ────────────────────────────────
-- (NEXUS's chat history — unrelated to GEMINI_API_KEY, which stays
-- server-side only in server/providers and is never stored here.)
create table if not exists public.nexus_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  context_used text[] not null default '{}'
);
alter table public.nexus_conversations enable row level security;
create policy "nexus_conversations: select own" on public.nexus_conversations for select using (user_id = auth.uid());
create policy "nexus_conversations: insert own" on public.nexus_conversations for insert with check (user_id = auth.uid());
create policy "nexus_conversations: update own" on public.nexus_conversations for update using (user_id = auth.uid());
create policy "nexus_conversations: delete own" on public.nexus_conversations for delete using (user_id = auth.uid());

create table if not exists public.nexus_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid not null references public.nexus_conversations(id) on delete cascade,
  role text not null,
  content text not null default '',
  tool_call jsonb,
  tool_call_resolution text,
  context_labels text[] not null default '{}',
  "timestamp" timestamptz not null default now()
);
alter table public.nexus_messages enable row level security;
create policy "nexus_messages: select own" on public.nexus_messages for select using (user_id = auth.uid());
create policy "nexus_messages: insert own" on public.nexus_messages for insert with check (user_id = auth.uid());
create policy "nexus_messages: update own" on public.nexus_messages for update using (user_id = auth.uid());
create policy "nexus_messages: delete own" on public.nexus_messages for delete using (user_id = auth.uid());

-- ── Realtime — enable change broadcasts for the tables that sync live ──
-- (Supabase Realtime reads the WAL via this publication.)
alter publication supabase_realtime add table
  public.projects,
  public.tasks,
  public.calendar_events,
  public.time_sessions,
  public.ideas,
  public.boards,
  public.board_items,
  public.activities,
  public.user_settings,
  public.english_sessions,
  public.english_stats,
  public.nexus_conversations,
  public.nexus_messages;
