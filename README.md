# Beacon

**AI-powered academic dashboard for Purdue students.**

> CNIT 566 — Final Project
> Author: **Udaya Tejas**
> Purdue University · Spring 2026

Beacon aggregates course data from Brightspace (D2L) — grades, assignments, content, and announcements — into a single dashboard, and layers AI on top to generate daily briefings, answer natural-language questions, and surface grade trends. The goal is to turn Brightspace from a system of record into a workspace.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Database schema](#database-schema)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Design system](#design-system)
- [AI layer](#ai-layer)
- [Security](#security)
- [Presentation](#presentation)
- [Fallback plans](#fallback-plans)
- [Academic integrity](#academic-integrity)

---

## Features

- **Unified dashboard** — every course, grade, and upcoming deadline on one page.
- **AI daily briefing** — a streaming summary of what is due, what is coming up, and what needs attention.
- **Ask Beacon** — a natural-language chat interface that can answer questions over a student's real academic data, with separate global and per-course scopes.
- **Unified calendar** — month and week views of assignments across every course, color-coded.
- **Grade analytics** — weighted grade calculations and AI-generated insights that highlight weak spots.
- **Content browser** — hierarchical view of Brightspace course modules and topics.
- **Instructor card** — automatically extracts contact details and office hours from course syllabi via AI.
- **Daily checklist** — auto-populated from upcoming assignments, with custom tasks and a daily reset.
- **Mobile-ready** — responsive layout, PWA-friendly, dark-mode and light-mode support.

## Tech stack

| Layer            | Choice                                                    |
| ---------------- | --------------------------------------------------------- |
| Framework        | Next.js 16 (App Router) + React 19                        |
| Language         | TypeScript (strict mode)                                  |
| Styling          | Tailwind CSS v4 · Framer Motion · Lucide icons            |
| Auth + Database  | Supabase (Postgres + Auth + Row-Level Security)           |
| External data    | Brightspace Valence API (D2L)                             |
| AI               | Streaming completions via Server-Sent Events              |
| Browser control  | Playwright (for Brightspace DUO 2FA fallback)             |
| State            | Zustand · React hooks                                     |
| Build / deploy   | Vercel-ready                                              |

## Architecture

```
Browser  ──▶  Next.js App Router
                ├── Server components (SSR)
                ├── Client components (interactive UI)
                └── API routes (21 endpoints)
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
       Supabase Postgres    AI provider (streaming)
          (RLS on every row)
              ▲
              │ (background sync)
              │
       Brightspace Valence API
              ▲
              │ (auth fallback)
              │
         Playwright (DUO 2FA)
```

- **No separate backend.** Every server-side concern — auth, sync, AI, rate limiting — lives in Next.js API routes. One codebase, one deploy.
- **Local-first reads.** The dashboard never queries Brightspace directly at runtime. A background sync job writes into Supabase, and the UI reads from there.
- **Two-step auth.** Supabase Auth owns Beacon identity; Brightspace OAuth (or a Playwright-captured session) owns LMS data access.
- **Streaming AI.** Async generators are wrapped into Server-Sent Events for token-by-token responses on the briefing, ask, and grade-insight endpoints.

## Database schema

Eight tables, all with Row-Level Security scoped to `auth.uid()`:

| Table             | Purpose                                                           |
| ----------------- | ----------------------------------------------------------------- |
| `users`           | Extends Supabase auth with Brightspace tokens + sync state        |
| `courses`         | Synced course enrollments                                         |
| `assignments`     | Dropbox folders + quizzes with due dates and grades               |
| `content_modules` | Hierarchical course modules                                       |
| `content_topics`  | Individual content items within modules                           |
| `announcements`   | Course news items                                                 |
| `briefings`       | Cached AI daily briefings                                         |
| `chat_messages`   | Chat history — nullable `course_id` for global vs. per-course scope |

Migrations live in `supabase/migrations/`.

## Getting started

### Prerequisites

- Node.js ≥ 20
- Python ≥ 3.10 (only needed to rebuild the presentation PDF/PPTX)
- A Supabase project
- An AI provider API key (Anthropic or OpenAI)
- A Purdue Brightspace account (for live data)

### Install

```bash
git clone <this-repo-url>
cd CNIT566-Project
npm install
npx playwright install chromium
```

### Configure

Copy the environment template and fill it in:

```bash
cp .env.example .env.local
```

Run the database migrations:

```bash
npx supabase db push
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, connect Brightspace from `/settings`, and wait for the first sync to complete.

### Useful routes

| Route            | What it does                                |
| ---------------- | ------------------------------------------- |
| `/`              | Landing page + auth                         |
| `/dashboard`     | Main dashboard                              |
| `/course/[id]`   | Course detail (7 tabs)                      |
| `/ask`           | Global AI chat                              |
| `/calendar`      | Cross-course calendar                       |
| `/settings`      | Theme, Brightspace auth, data export        |
| `/presentation`  | In-app slide deck (CNIT 566 presentation)   |

## Project structure

```
src/
├── app/                 # Next.js App Router (pages + API routes)
│   ├── api/             # 21 endpoints grouped by domain
│   ├── dashboard/
│   ├── course/[courseId]/
│   ├── ask/
│   ├── calendar/
│   ├── settings/
│   └── presentation/    # In-app slides + generated PDF/PPTX
├── components/          # UI (dashboard, course, layout, ask, ui)
├── lib/
│   ├── ai/              # Prompts, client, briefing, NLQ, summarize
│   ├── brightspace/     # OAuth, client, sync, Playwright fallback
│   ├── supabase/        # Client/server/admin wrappers + helpers
│   └── utils/           # Dates, formatting, course names
├── hooks/               # Custom React hooks
├── stores/              # Zustand store
└── types/               # Shared TypeScript types
supabase/migrations/     # SQL migrations
```

## Design system

Beacon uses a **monochrome-first** palette — pure oklch achromatic colors with zero chroma. The only chromatic hues are semantic: emerald for A-grades and success states, descending through amber, orange, and rose for grades B–D.

- Headlines use `font-light` (weight 300). No bold headlines.
- The brand mark is `[beacon]` in a monospace medium weight, always lowercase and bracketed.
- Buttons are always pill-shaped (`rounded-full`).
- Cards use `rounded-2xl` with a 1px border and no resting shadow.
- Inputs use `rounded-full` with a soft focus ring.
- Framer Motion drives entrance and hover animations only — there is no scroll re-animation.

The full palette is declared in `src/app/globals.css` via CSS custom properties mapped into a Tailwind v4 `@theme` block.

## AI layer

The AI is configured in `src/lib/ai/` and exposes four helpers:

- `generateCompletion` — one-shot completion.
- `generateCompletionWithHistory` — conversation-aware completion.
- `generateCompletionStream` — async-generator streaming.
- `streamToSSEResponse` — wraps a generator into a Server-Sent Events HTTP response.

Six tuned system prompts in `src/lib/ai/prompts.ts` drive the briefing, NLQ, course NLQ, assignment analysis, grade insight, and generic summarization flows. A `buildAcademicContext()` helper assembles the user's real academic data into structured markdown before prompting, so the model sees clean context instead of raw JSON.

In-memory per-user, per-endpoint rate limiting (`src/lib/rateLimit.ts`) prevents abuse: briefings are capped at 10 requests per minute and chat at 20 per minute.

## Security

- **Row-Level Security** on every table — `USING (user_id = auth.uid())`. The database enforces isolation independently of the API layer.
- **Session cookies server-side only.** Brightspace credentials never reach the browser.
- **JWT-validated API routes.** Every `/api/*` handler verifies the Supabase session before reading data.
- **Rate limits** on AI endpoints prevent cost blowouts.
- **Environment-variable secrets.** `.env.local` is gitignored and never committed; `.env.example` ships with the repo for setup.
- **24-hour session expiry** on Brightspace cookies — expired sessions force a clean re-authentication.

## Presentation

A self-contained slide deck lives at `/presentation` and mirrors the project's design system. Pre-generated exports sit in `src/app/presentation/`:

- `beacon-presentation.pdf`
- `beacon-presentation.pptx`

To regenerate them after edits to the slide component:

```bash
# With the dev server running
node src/app/presentation/_build-slides.mjs
python3 src/app/presentation/_build-exports.py
```

The build scripts and raw screenshot frames are gitignored — only the final PDF/PPTX are tracked.

## Fallback plans

If Brightspace API approval is delayed or unavailable, the architecture supports three fallback data sources without any changes to the UI or database:

- **A — Manual upload.** Students upload syllabus PDFs and grade CSVs.
- **B — DOM scraper.** A Chrome extension reads the Brightspace DOM directly.
- **C — Mock data.** The same schema populated with realistic sample rows for demo purposes.

## Academic integrity

This project was developed as the final deliverable for **CNIT 566** at Purdue University by **Udaya Tejas**. All architectural decisions, source code, database schema, design system, and written materials are my own work. External libraries are credited through `package.json`; third-party services (Supabase, Brightspace, AI providers) are used only as documented API consumers.
