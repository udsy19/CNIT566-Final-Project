# Beacon — Local App Edition

**AI-powered academic dashboard for Purdue students. Runs entirely on your laptop.**

> CNIT 566 — Final Project · `localapp` branch
> Author: **Udaya Tejas**
> Purdue University · Spring 2026

This is the **local-first build** of Beacon. No Supabase project, no Anthropic API key, no Vercel deploy. One `npm install`, one `npm run dev`, and the entire app runs against an embedded SQLite database with optional local AI through Ollama.

For the cloud version with live Brightspace sync, see the `main` branch.

---

## Quick start

```bash
git clone https://github.com/udsy19/CNIT566-Final-Project.git
cd CNIT566-Final-Project
git checkout localapp
npm install
npm run db:seed     # creates demo@purdue.edu with realistic Purdue data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in:

- **Email:** `demo@purdue.edu`
- **Password:** `purdue123`

That's the whole setup. The dashboard, calendar, course detail tabs, and `/ask` chat all work immediately. AI surfaces show clearly-labelled demo responses until you install Ollama (next section).

## Optional: real AI via Ollama

The AI features (daily briefing, Ask Beacon, grade insights, instructor extraction) call a locally-running [Ollama](https://ollama.com) instance over its OpenAI-compatible HTTP endpoint. If Ollama isn't running, every AI surface falls back to demo responses so the UI keeps working.

```bash
brew install ollama       # or download from ollama.com
ollama serve &            # start the local daemon
ollama pull qwen2.5:7b    # ~4.7 GB; one-time download
```

Restart the dev server. The app detects Ollama on first request and starts streaming real responses.

To use a different model, set `OLLAMA_MODEL=llama3.1:8b` (or any other Ollama model) in `.env.local`.

## What's different from the `main` branch?

| | `main` (cloud) | `localapp` (this branch) |
|---|---|---|
| Database | Supabase Postgres | Local SQLite via `better-sqlite3` |
| Auth | Supabase Auth (email/Google) | Local session cookies + argon2id, Purdue email gate |
| AI | Anthropic Claude API | Local Ollama (qwen2.5:7b default) with demo fallback |
| Brightspace sync | Live OAuth + Playwright | Optional — seed script provides realistic demo data |
| External services | Supabase, Anthropic, Vercel | None |
| First-run setup | Configure 14 env vars + run migrations | Run two npm commands |

## Project structure

```
src/
├── app/                 # Next.js App Router (pages + API routes)
│   ├── api/auth/        # signup, signin, signout (cookie-based)
│   ├── api/...          # all original Beacon endpoints
│   ├── dashboard/, course/, ask/, calendar/, settings/
│   └── presentation/    # in-app slide deck
├── lib/
│   ├── db/              # Drizzle schema, client, migrate, queries
│   │   ├── schema.ts          # 9 tables (8 app + sessions)
│   │   ├── client.ts          # lazy SQLite connection + auto-migrate
│   │   ├── queries.ts         # domain helpers (Users, Courses, ...)
│   │   └── schema-types.ts    # Drizzle-inferred row types
│   ├── auth/            # session.ts (cookie auth), password.ts (argon2id)
│   ├── supabase/        # back-compat shim — same .from(...) API on Drizzle
│   ├── ai/              # Ollama client + demo fallback + prompts
│   └── brightspace/     # OAuth + Playwright (only used if you connect)
scripts/
└── seed.ts              # populates the demo Purdue student account
drizzle/
└── 0000_initial.sql     # generated migration SQL
```

## Database

SQLite database file lives at `data/beacon.sqlite`. It's gitignored — every laptop builds its own. Migrations run automatically on first request. To reset the DB: `rm -rf data && npm run db:seed`.

```bash
# Useful database commands
npm run db:migrate    # apply pending migrations (auto-runs on dev start)
npm run db:seed       # populate the demo Purdue account
npm run db:generate   # regenerate migrations after editing schema.ts
npm run db:studio     # open Drizzle Studio (browser GUI for the DB)
```

## Auth

The local-app build uses session-cookie auth backed by the SQLite `sessions` table. Passwords are hashed with **argon2id** via `@node-rs/argon2`. Sessions are httpOnly, sameSite=lax, with sliding 30-day expiry.

The signup endpoint enforces a `@purdue.edu` email gate — non-Purdue addresses get a 400 with a friendly message.

```
POST /api/auth/signup    — create account + start session
POST /api/auth/signin    — verify password + start session
POST /api/auth/signout   — invalidate session + clear cookie
GET  /api/user           — return the current user (sans password hash)
```

## Brightspace (optional)

If you want to pull your real Purdue Brightspace data into the local DB, the OAuth + Playwright DUO flow from `main` still works on this branch — the sync writes into the same SQLite tables instead of Supabase. Connect from `/settings`. If you don't connect, the seeded demo data is what powers the dashboard.

## AI architecture

Six tuned system prompts in `src/lib/ai/prompts.ts` drive briefings, Ask Beacon (global + per-course), assignment analysis, grade insights, and generic summarization. The `buildAcademicContext()` helper assembles your real academic data into structured markdown before prompting, so the model sees clean context instead of raw rows.

Streaming uses async generators wrapped into Server-Sent Events at `streamToSSEResponse()`. The same helper drives `/api/briefing`, `/api/ask`, `/api/ask/course`, and `/api/course/grade-insight`.

In-memory rate limiting at `src/lib/rateLimit.ts` keeps demo abuse in check: briefings 10/min, chat 20/min.

## Dev environment

- Node.js ≥ 20
- One-time: `npx playwright install chromium` (only needed if you plan to use Brightspace sync)
- macOS / Linux / Windows all supported — `better-sqlite3` ships native binaries for each

## Academic integrity

This project was developed as the final deliverable for **CNIT 566** at Purdue University by **Udaya Tejas**. All architectural decisions, source code, database schema, design system, and written materials are my own work. External libraries are credited through `package.json`; third-party services (Brightspace, Ollama) are used only as documented API consumers.
