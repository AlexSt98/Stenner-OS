# STENNER OS

**Your Creative Command Center.** A personal operating system for organizing creative work, projects, tasks, time and ideas — one system, not five disconnected apps.

STENNER OS V1 is a fully functional local-first app: everything runs in the browser, persisted to LocalStorage. V1.2 adds NEXUS, which needs one small local server — see below — but the rest of the app still needs no account and no cloud backend.

## Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Zustand (with the `persist` middleware for LocalStorage)
- React Router
- Lucide icons · date-fns · uuid · react-markdown
- **NEXUS's server**: a small Express process (`server/`) + the official `@google/generative-ai` SDK — the only part of STENNER OS that isn't 100% client-side, and only because an AI provider key can never live in the frontend.

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
- **NEXUS** — "The intelligence behind your workflow." Not a generic chatbot: it reads only the STENNER OS context relevant to what you ask (today's tasks, TEOPM hours, a project's progress, English Lab mistakes, time tracked, calendar, ideas — see `src/lib/nexus/context.ts`), then answers or *proposes* an action (create/update/complete a task, create a project/idea/event, start/stop the timer) as a confirm-or-cancel card — nothing executes without you clicking Confirm. Conversations persist locally with a history sidebar; responses stream in and render as Markdown. Runs in **demo mode** (real computed answers, no network) until a provider is connected in Settings.
- **Stats** — 7-day completion chart, time-by-category, project progress overview, full activity log.
- **Gamification** — +100 XP per completed task (TEOPM tasks included), XP per English exercise, levels, a daily streak (plus English Lab's own streak), small reward toasts.
- **Settings** — profile, data export/reset/clear, and a roadmap of what's next.

## Data model

All shapes live in [`src/types/index.ts`](src/types/index.ts): `Task`, `Project`, `CalendarEvent`, `TimeSession`, `Idea`, `Board`/`BoardItem`, `Activity`, `UserSettings`, plus `EnglishExercise`/`EnglishSession`/`EnglishAnswer` for English Lab. `DailyWorkday`/`EnglishProgress`/`EnglishMistake` are documented types but intentionally *not* persisted — they're computed by selectors ([`src/store/selectors.ts`](src/store/selectors.ts)) from Task/TimeSession/EnglishSession records, so there's nothing to keep in sync and history for past days just falls out of the existing data. The whole app reads/writes through one Zustand store ([`src/store/useStore.ts`](src/store/useStore.ts)), so swapping the persistence layer later doesn't touch the UI.

## NEXUS — connecting a real AI provider

1. `cp .env.example .env` and set `GEMINI_API_KEY` (get one at https://aistudio.google.com/apikey). **Never** put it in frontend code, LocalStorage, or `VITE_`-prefixed vars — `server/` is the only thing that reads it, via plain `process.env`.
2. Restart `npm run dev` (the server reads `.env` once at boot).
3. Settings → NEXUS shows "Connected" once it can see the key; NEXUS itself switches from demo mode to real Gemini responses automatically.

**Architecture** — the frontend talks to exactly one endpoint, `/api/nexus/*` (see `src/lib/nexus/client.ts`), and never imports a provider SDK. The server maps that to an `AIProvider` abstraction (`server/providers/AIProvider.ts`: `generateResponse` / `streamResponse` / `generateStructuredOutput`); `GeminiProvider` is the only one implemented, `OpenAIProvider`/`AnthropicProvider` are typed scaffolds that throw until someone fills them in — adding a real one and flipping `AI_PROVIDER` in `.env` is the entire migration, no frontend or route changes. Tool/function calls (creating a task, etc.) come back from the model as structured data over the same stream and always render as a confirm/cancel `ActionCard` — see `src/lib/nexus/tools.ts` (declarations) and `src/lib/nexus/executeAction.ts` (the one place a tool call becomes a real store mutation, only on explicit confirm).

## Integrations (scaffolded, not wired)

V1 intentionally ships with no external credentials for these. [`src/lib/integrations/index.ts`](src/lib/integrations/index.ts) defines the seams for what's next, so adding them later doesn't mean rearchitecting:

- PostgreSQL (swap the LocalStorage adapter for a real API)
- Authentication
- Google Calendar / Drive / Gmail (OAuth)
- Webhooks (fired from the existing Activity log)
- Automations ("when idea tagged X → create task")
