# STENNER OS

**Your Creative Command Center.** A personal operating system for organizing creative work, projects, tasks, time and ideas — one system, not five disconnected apps.

STENNER OS V1 is a fully functional local-first app: everything runs in the browser, persisted to LocalStorage, no backend or account required.

## Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Zustand (with the `persist` middleware for LocalStorage)
- React Router
- Lucide icons · date-fns · uuid

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Demo data seeds automatically on first run.

```bash
npm run build    # type-check + production build
npm run preview  # preview the production build
npm run lint     # oxlint
```

## What's in V1

- **Home** — dynamic stats (today's tasks, focus time, streak, active projects, XP/level), task queue, mini calendar, time tracker, quick add, projects, ideas, recent activity.
- **Tasks** — full CRUD, drag-to-reorder, status/priority/project/category, due date + time, estimated vs. actual time, detail panel with a "Start timer" shortcut.
- **Calendar** — week grid (Mon–Fri), click-to-create events, edit/delete, tasks with a due time render as blocks. A "Google Calendar" button is present but inert — see Integrations below.
- **Time Tracker** — start/pause/stop, runs in the background across every page, session history, Today/Week/Month breakdowns by category.
- **Projects** — progress is computed automatically from each project's linked tasks; per-project detail page with its own task queue and time tracked.
- **Ideas Vault** — capture title/description/tags/image/URL; convert an idea straight into a Task, a Project, or a Board item.
- **Boards** — a lightweight visual canvas: draggable text, sticky notes, image drops and dashed "sections," per board.
- **Stats** — 7-day completion chart, time-by-category, project progress overview, full activity log.
- **Gamification** — +100 XP per completed task, levels, a daily streak, small reward toasts.
- **Settings** — profile, data export/reset/clear, and a roadmap of what's next.

## Data model

All shapes live in [`src/types/index.ts`](src/types/index.ts): `Task`, `Project`, `CalendarEvent`, `TimeSession`, `Idea`, `Board`/`BoardItem`, `Activity`, `UserSettings`. The whole app reads/writes through one Zustand store ([`src/store/useStore.ts`](src/store/useStore.ts)), so swapping the persistence layer later doesn't touch the UI.

## Integrations (scaffolded, not wired)

V1 intentionally ships with no external credentials. [`src/lib/integrations/index.ts`](src/lib/integrations/index.ts) defines the seams for what's next, so adding them later doesn't mean rearchitecting:

- PostgreSQL (swap the LocalStorage adapter for a real API)
- Authentication
- Google Calendar / Drive / Gmail (OAuth)
- AI (task suggestions, summarization, auto-scheduling)
- Webhooks (fired from the existing Activity log)
- Automations ("when idea tagged X → create task")
