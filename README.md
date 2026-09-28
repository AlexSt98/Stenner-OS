# STENNER OS

**Your Creative Command Center.** A personal operating system for organizing creative work, projects, tasks, time and ideas — one system, not five disconnected apps.

STENNER OS V1 is a fully functional local-first app: everything runs in the browser, persisted to LocalStorage. Two modules are exceptions, each for a concrete reason: **NEXUS** needs one small local server, because an AI provider key can never live in the frontend; and **Marketing Lab** needs Supabase and a sign-in, because research has to survive a cleared browser and sits behind row-level security. Everything else still needs no account and no cloud backend.

## Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Zustand (with the `persist` middleware for LocalStorage)
- React Router
- Lucide icons · date-fns · uuid · react-markdown
- **NEXUS's server**: a small Express process (`server/`) — an AI provider key can never live in the frontend.
- **Marketing Lab's backend**: Supabase (Postgres + Auth) via `@supabase/supabase-js`, behind a repository interface. Used by Marketing Lab only.

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Demo data seeds automatically on first run. `npm run dev` starts **two** processes together (Vite on 5173, NEXUS's API on 8787, proxied under `/api`) — see NEXUS below to actually connect it; without a key it runs in demo mode automatically.

```bash
npm run build          # type-check + production build (frontend)
npm run check:server   # type-check the server (tsc --noEmit, tsx doesn't type-check)
npm run preview        # preview the production build
npm run lint           # oxlint
```

## What's in V1

- **Home** — dynamic stats (today's tasks, focus time, streak, active projects, XP/level), task queue, mini calendar, time tracker, quick add, projects, ideas, recent activity.
- **Tasks** — full CRUD, drag-to-reorder, status/priority/project/category, due date + time, estimated vs. actual time, detail panel with a "Start timer" shortcut.
- **Calendar** — week grid (Mon–Fri), click-to-create events, edit/delete, tasks with a due time render as blocks. A "Google Calendar" button is present but inert — see Integrations below.
- **Time Tracker** — start/pause/stop, runs in the background across every page, session history, Today/Week/Month breakdowns by category.
- **Projects** — progress is computed automatically from each project's linked tasks; per-project detail page with its own task queue and time tracked.
- **Ideas Vault** — capture title/description/tags/image/URL; convert an idea straight into a Task, a Project, or a Board item.
- **Boards** — a lightweight visual canvas: draggable text, sticky notes, image drops and dashed "sections," per board.
- **TEOPM Workday** — a daily 8h work tracker. A "workday task" is just a Task on the TEOPM project, so it's not a parallel system: Today's Tasks, Completed Tasks (filterable + searchable history), a Daily Progress card (decimal hours, e.g. "5.5 / 8.0", with a workday-complete celebration), and its own Today/Week/Month calendar.
- **English Lab** — a daily 10-exercise mixed challenge (grammar, vocabulary, listening, dictation, business English, writing, speaking) that's the same every day until midnight, then rotates. Listening uses the browser's SpeechSynthesis; speaking uses SpeechRecognition with a typed fallback when unsupported; writing/speaking are scored by a local heuristic (see Integrations below for the AI seam). Tracks per-skill progress, a "Needs Practice" list by grammar/vocab topic, and its own streak.
- **Marketing Lab** — a strategic research workspace, not a marketing dashboard. See its own section below.
- **NEXUS** — "The intelligence behind your workflow." Not a generic chatbot: it reads only the STENNER OS context relevant to what you ask (today's tasks, TEOPM hours, a project's progress, English Lab mistakes, time tracked, calendar, ideas — see `src/lib/nexus/context.ts`), then answers or *proposes* an action (create/update/complete a task, create a project/idea/event, start/stop the timer) as a confirm-or-cancel card — nothing executes without you clicking Confirm. Conversations persist locally with a history sidebar; responses stream in and render as Markdown. Runs in **demo mode** (real computed answers, no network) until a provider is connected in Settings.
- **Stats** — 7-day completion chart, time-by-category, project progress overview, full activity log.
- **Gamification** — +100 XP per completed task (TEOPM tasks included), XP per English exercise, levels, a daily streak (plus English Lab's own streak), small reward toasts.
- **Settings** — profile, data export/reset/clear, and a roadmap of what's next.

## Marketing Lab

A research instrument for building strategic knowledge about a company. It is deliberately not a marketing dashboard: there are no vanity metrics, no "ideas generated" counters, and no invented numbers anywhere. It follows one pipeline end to end:

```
RESEARCH → EVIDENCE → HYPOTHESIS → VALIDATION → DECISION → STRATEGY → MARKETING BOOK
```

The whole module exists to answer five questions at any moment: **where are we, what do we know, what don't we know, what is blocking the research, and what should I research next.**

### Two rules that shape everything

**Nothing derivable is stored.** Research gaps, progress, what-we-know / what-we-don't-know and the next research action are all computed from the records, in [`src/lib/marketing/`](src/lib/marketing/). Persisting them would desynchronise them the moment a single answer changes. This is the same convention the rest of the codebase already follows with `DailyWorkday` and `EnglishProgress` — documented types that are intentionally never written down.

**Nothing is invented.** Every figure comes from a record you created. An untouched project reports "No research data yet" rather than a row of zeros, every list has a real empty state, and the next research action returns *"No next research action defined."* instead of manufacturing a recommendation. A zero reads as a measurement, and there has been no measurement.

### Knowledge has a hard bar

Writing an answer never makes something known. A finding reaches **WHAT WE KNOW** only when it is `validated` **with evidence attached**, or settled by a decision. A question marked validated with nothing backing it is reported as an *uncertain assumption* instead — the claim outruns its backing. This single rule is what separates the tool from a notes app.

### Research Mode / Strategy Mode

The two modes swap the entire secondary navigation rather than filtering one screen, so raw research is never one click away from the consolidated output.

| Research Mode | Strategy Mode |
|---|---|
| Control Center · 14 phases · Evidence · Hypotheses · Decision Log · Research Gaps · Know / Don't Know | ICP & Segments · Personas · Competition · Positioning · Messaging · LinkedIn · Content & Visual · Measurement · Roadmap · **Marketing Book** |

Nothing crosses between them automatically. A hypothesis only becomes strategy when someone reads the research and writes the conclusion — there is no code path from one to the other.

### The 14 phases

`01 Foundation · 02 U.S. Market · 03 Segmentation · 04 ICP · 05 Buyer Personas · 06 Buying Committee · 07 Customer Journey · 08 Competition · 09 Positioning · 10 Messaging · 11 LinkedIn · 12 Content & Visual · 13 Measurement · 14 Roadmap`

Each ships with template research questions (~58 in total, written in Spanish) defined in [`src/lib/marketing/phaseTemplates.ts`](src/lib/marketing/phaseTemplates.ts). These are the **method, not findings** — the equivalent of a lab protocol — so a new project opens with real work to do instead of an empty screen. Every question carries four fields, because a research instrument has to explain itself:

| Field | |
|---|---|
| `text` | the question |
| `purpose` | what answering it unblocks |
| `guidance` | how to actually go about it |
| `expectedEvidence` | what would count as a real answer rather than an opinion |

All of them are editable, deletable and extensible. House style: observable, decidable, and tied to something downstream. *"Who is our target customer?"* is not a research question — it has no evidence standard and nothing depends on its answer.

### Research gaps and the next action

Gaps are **detected, never authored**. Five kinds, each with a concrete reason, a next action, and a `[Start Research]` button that deep-links to the exact question that would close it:

`blocked_decision` · `missing_evidence` · `unresolved_hypothesis` · `unanswered_question` · `uncertain_assumption`

The next research action picks the single most consequential one, in that priority order, with a manually queued HIGH item outranking all of it — an explicit instruction from the researcher beats a derived one.

### Marketing Book

Nineteen sections built from consolidated output. Every claim pulled in from research is tagged **FACT / INFERENCE / HYPOTHESIS / DECISION**, so a hypothesis can never read as a fact, and the book includes its own Research Gaps section rather than hiding what is still unknown. Exports to JSON (complete, round-trippable), XLSX (one sheet per entity, reusing the `xlsx` package already in the project) and PDF via a dedicated print stylesheet. DOCX is deferred — it needs a new dependency.

### Data model

Seventeen tables, all prefixed `ml_`, defined in [`supabase/migrations/20260928140000_marketing_lab.sql`](supabase/migrations/20260928140000_marketing_lab.sql) and mirrored 1:1 by the types in [`src/types/marketing.ts`](src/types/marketing.ts).

```
auth.users
   └─1:N─ ml_workspaces ────┬─1:N─ ml_phases ─1:N─ ml_questions
                            │                          ├─1:N─ ml_evidence
                            │                          ├─1:N─ ml_hypotheses
                            │                          └─1:N─ ml_notes
                            ├─1:N─ ml_decisions · ml_sources · ml_research_queue
                            ├─1:N─ ml_personas · ml_segments · ml_competitors
                            │      ml_content_pillars · ml_roadmap_items
                            ├─1:N─ ml_strategy_outputs
                            └─1:N─ ml_book_sections
```

Every row carries `user_id DEFAULT auth.uid()` under RLS, and every child also carries `workspace_id` — that column is what keeps TEOPM and GEO-CX isolated, since no selector ever reads across workspaces.

Two design decisions worth knowing. **`ml_evidence_links` is a bridge table with a `stance`** (`supports` / `contradicts` / `context`) rather than two id arrays on the hypothesis, because the same source can support one hypothesis while contradicting another — the stance belongs to the relationship, not to the evidence. And the ordering column is **`sort_order`, never `order`**: the latter is reserved in SQL *and* collides with PostgREST's `?order=` sorting parameter.

Deleting a workspace cascades to everything under it. Deleting a question does **not** destroy the evidence collected for it (`ON DELETE SET NULL`).

### Storage

All access goes through one repository interface ([`src/store/marketing/repository.ts`](src/store/marketing/repository.ts)) with two adapters. Nothing in the UI knows where data lives.

| Adapter | When it is used |
|---|---|
| `supabaseRepository` | **Default**, whenever `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set |
| `localRepository` | Fallback with no credentials, or forced with `VITE_MARKETING_BACKEND=local` |

The local adapter writes to its own key, `stenner-marketing-local-v2`, and **never touches `stenner-os-storage-v1`** — nothing it does can affect Tasks, TEOPM, English Lab or NEXUS. Marketing Lab also has its own Zustand store ([`useMarketingStore`](src/store/marketing/useMarketingStore.ts)), separate from `store/useStore.ts`: that one is synchronous and persisted wholesale, this one is asynchronous and repository-backed, and merging them would force one model onto the other. It is consequently the first module in STENNER OS with real loading and error states.

### Authentication

Marketing Lab is the **only** part of STENNER OS behind a sign-in, and only because its tables enforce `user_id = auth.uid()` for the `authenticated` role — an unauthenticated caller matches no policy and sees nothing. Tasks, Calendar, Time Tracker, Boards, Ideas, Projects, TEOPM Workday, English Lab, NEXUS and Stats all keep working with no account.

On first sign-in against an empty database, the two projects the product ships with — **TEOPM** and **GEO-CX** — are created with their 14-phase framework and questions, and with no findings of any kind.

## Marketing Lab — setup

1. Add to `.env` (values from Supabase → Project Settings → API). The `VITE_` prefix is required: Vite only exposes prefixed vars to the browser bundle, and the anon key is safe there by design because RLS protects every table.

   ```bash
   VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon / public key>
   SUPABASE_SERVICE_ROLE_KEY=<service_role key>   # server/scripts only — never VITE_
   ```

   Set the same three in your Vercel project for deployments.

2. Apply the migration:

   ```bash
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```

3. Verify. This is read-only — it issues nothing but `GET` and `SELECT`, and never prints the value of any environment variable:

   ```bash
   npm run check:supabase
   ```

   It reports which env vars are present and well-formed, whether REST/Auth/Storage answer, the auth configuration, the tables in the public schema, and an RLS audit comparing what `anon` sees against what `service_role` sees.

4. Open `/marketing`, create your account, then **disable signups** in the Supabase dashboard (Authentication → Providers → Email). The anon key is public, so an open signup endpoint lets anyone register on the project.

To work without a database, set `VITE_MARKETING_BACKEND=local`.

## Data model

All shapes live in [`src/types/index.ts`](src/types/index.ts): `Task`, `Project`, `CalendarEvent`, `TimeSession`, `Idea`, `Board`/`BoardItem`, `Activity`, `UserSettings`, plus `EnglishExercise`/`EnglishSession`/`EnglishAnswer` for English Lab. `DailyWorkday`/`EnglishProgress`/`EnglishMistake` are documented types but intentionally *not* persisted — they're computed by selectors ([`src/store/selectors.ts`](src/store/selectors.ts)) from Task/TimeSession/EnglishSession records, so there's nothing to keep in sync and history for past days just falls out of the existing data. Everything except Marketing Lab reads/writes through one Zustand store ([`src/store/useStore.ts`](src/store/useStore.ts)), so swapping the persistence layer later doesn't touch the UI. Marketing Lab's shapes live separately in [`src/types/marketing.ts`](src/types/marketing.ts) behind their own async store and repository — see above — and follow the same never-persist-what-you-can-compute rule.

## NEXUS — connecting a real AI provider

1. `cp .env.example .env` and set `OPENAI_API_KEY` (get one at https://platform.openai.com/api-keys). **Never** put it in frontend code, LocalStorage, or `VITE_`-prefixed vars — `server/` is the only thing that reads it, via plain `process.env`.
2. Restart `npm run dev` (the server reads `.env` once at boot).
3. Settings → NEXUS shows "Connected" once it can see the key; NEXUS itself switches from demo mode to real OpenAI responses automatically.

**Architecture** — the frontend talks to exactly one endpoint, `/api/nexus/*` (see `src/lib/nexus/client.ts`), and never imports a provider SDK. The server maps that to an `AIProvider` abstraction (`server/providers/AIProvider.ts`: `generateResponse` / `streamResponse` / `generateStructuredOutput`); `OpenAIProvider` (built on OpenAI's Responses API) is the only one implemented, `AnthropicProvider` is a typed scaffold that throws until someone fills it in — adding a real one and flipping `AI_PROVIDER` in `.env` is the entire migration, no frontend or route changes. NEXUS originally ran on Gemini; that provider has been fully removed. Tool/function calls (creating a task, etc.) come back from the model as structured data over the same stream and always render as a confirm/cancel `ActionCard` — see `src/lib/nexus/tools.ts` (declarations) and `src/lib/nexus/executeAction.ts` (the one place a tool call becomes a real store mutation, only on explicit confirm).

## Integrations (scaffolded, not wired)

V1 intentionally ships with no external credentials for these. [`src/lib/integrations/index.ts`](src/lib/integrations/index.ts) defines the seams for what's next, so adding them later doesn't mean rearchitecting:

- Google Calendar / Drive / Gmail (OAuth)
- Webhooks (fired from the existing Activity log)
- Automations ("when idea tagged X → create task")

PostgreSQL and authentication have since stopped being hypothetical, but only for Marketing Lab: it runs on Supabase behind a sign-in, through the repository interface described above. The other modules are still LocalStorage and still need no account. Moving them across means writing a second implementation of that same interface, not rearchitecting.
