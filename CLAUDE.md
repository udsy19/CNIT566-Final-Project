# Beacon - AI-Powered Academic Dashboard

## Project Overview
Beacon is a unified academic dashboard for college students at Purdue University that integrates with Brightspace (D2L) LMS. It aggregates course data, deadlines, grades, and content into a single actionable interface with AI-powered features like daily briefings, natural language queries, and content summarization.

## Tech Stack
- **Framework:** Next.js 14 (App Router) — single codebase for frontend + API routes
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Database/Auth:** Supabase (Postgres + Auth + Realtime + Edge Functions)
- **Data Source:** Brightspace Valence API (D2L REST API with OAuth 2.0)
- **AI:** OpenAI GPT-4o-mini (primary, cost-efficient) or Anthropic Claude Sonnet (higher quality NLQ)
- **State Management:** Zustand
- **Deployment:** Vercel + Supabase

## Project Structure
```
beacon/
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout with auth provider
│   │   ├── page.tsx                  # Landing / login page
│   │   ├── dashboard/page.tsx        # Main dashboard
│   │   ├── course/[courseId]/page.tsx # Course detail view
│   │   ├── ask/page.tsx              # Ask Beacon chat interface
│   │   ├── settings/page.tsx         # User preferences
│   │   └── api/                      # All API routes (Next.js API Routes)
│   │       ├── auth/                 # Supabase auth + Brightspace OAuth
│   │       ├── sync/                 # Brightspace data sync
│   │       ├── courses/              # Course data
│   │       ├── assignments/          # Assignment data
│   │       ├── grades/               # Grade data
│   │       ├── briefing/             # AI daily briefing
│   │       ├── ask/                  # Natural language queries
│   │       └── summarize/            # Content summarization
│   ├── components/                   # React components
│   │   ├── ui/                       # Reusable UI primitives
│   │   ├── dashboard/                # Dashboard-specific components
│   │   ├── course/                   # Course detail components
│   │   ├── ask/                      # Chat interface components
│   │   └── layout/                   # Sidebar, TopBar, SyncStatus
│   ├── lib/
│   │   ├── supabase/                 # Supabase client (browser + server)
│   │   ├── brightspace/              # Brightspace OAuth + API client + sync
│   │   ├── ai/                       # AI client, prompts, briefing, NLQ, summarize
│   │   └── utils/                    # Date formatting, grade calc, etc.
│   ├── hooks/                        # Custom React hooks
│   ├── stores/                       # Zustand stores
│   └── types/                        # TypeScript type definitions
├── supabase/
│   └── migrations/                   # SQL migration files
├── middleware.ts                      # Next.js auth middleware
└── .env.local                        # Environment variables (never commit)
```

## Key Commands
```bash
npm run dev          # Start Next.js dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # Lint code
npx supabase start   # Start local Supabase
npx supabase db push # Push migrations
```

## Architecture Decisions
- **No separate backend server** — Next.js API routes handle everything (auth, sync, AI). One codebase, one deploy.
- **Supabase Auth** — Email magic links and/or Google SSO for Beacon login. Brightspace is a separate OAuth flow for data access.
- **Two-step auth** — (1) Supabase Auth for Beacon identity, (2) Brightspace OAuth for LMS data access.
- **Brightspace data synced to Supabase** — API routes read from local Postgres, not Brightspace directly. Sync runs in background.
- **Bookmark-based pagination** — D2L APIs use bookmark pagination (not offset). Loop until `PagingInfo.HasMoreItems` is false.
- **AI context building** — User's academic data is formatted as structured text and injected into LLM system prompts.

## Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Brightspace OAuth
BRIGHTSPACE_CLIENT_ID=
BRIGHTSPACE_CLIENT_SECRET=
BRIGHTSPACE_BASE_URL=https://purdue.brightspace.com
BRIGHTSPACE_AUTH_URL=https://auth.brightspace.com/oauth2/auth
BRIGHTSPACE_TOKEN_URL=https://auth.brightspace.com/core/connect/token
BRIGHTSPACE_REDIRECT_URI=http://localhost:3000/api/auth/callback
BRIGHTSPACE_SCOPES=core:*:* content:*:* grades:*:* enrollments:*:*

# AI
OPENAI_API_KEY=
# or ANTHROPIC_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Database Tables
- `users` — Extends Supabase auth with Brightspace tokens and sync metadata
- `courses` — Synced course enrollments with grades
- `assignments` — Dropbox folders + quizzes with due dates and grades
- `content_modules` — Course content modules (hierarchical)
- `content_topics` — Individual content items within modules
- `announcements` — Course announcements/news
- `briefings` — Cached AI daily briefings
- `chat_messages` — Ask Beacon conversation history

## Conventions
- TypeScript strict mode throughout
- Tailwind CSS for all styling (no component library)
- API routes at `/api/*` (no versioning prefix for simplicity)
- Database tables use snake_case; TypeScript types use PascalCase
- All Brightspace API calls go through `BrightspaceClient` class (`src/lib/brightspace/client.ts`)
- RLS enabled on every table — users can only access their own data
- Never commit `.env` files or API keys

## Design System — [know] Frontend
- **Monochrome-first**: oklch achromatic palette (zero chroma). Only emerald-500 for success states.
- **Typography**: `font-light` (300) for ALL headlines. `font-medium` (500) for card titles, labels, buttons. Never `font-bold`/`font-semibold` for h1/h2.
- **Brand**: `[beacon]` in `font-mono font-medium`. Always lowercase with brackets.
- **Buttons**: Always `rounded-full` pill shape. Primary: `bg-foreground text-background`. Secondary: ghost/border only.
- **Cards**: `rounded-2xl border border-border bg-background`. No shadows at rest.
- **Inputs**: `rounded-full` pill shape with `focus:border-primary/50 focus:ring-2 focus:ring-primary/20`.
- **Section labels**: `text-xs font-mono text-muted-foreground` (sentence case in sections, `uppercase tracking-wider` for column headers).
- **Animations**: Framer Motion only. Entrances: `initial={{ opacity: 0, y: 20 }}` with `viewport={{ once: true }}`. Hover: `scale: 1.02` buttons, `y: -8` cards. Never re-animate on scroll.
- **System fonts only**: No custom font loading. Default Tailwind sans + mono stacks.
- **Colors via @theme**: CSS vars defined in `:root`, mapped in `@theme` block in globals.css for Tailwind v4.
- **Anti-patterns**: No colorful gradients, no `font-bold` headlines, no `rounded-md` buttons, no card shadows at rest, no emojis, no underlined links.

## Brightspace API Notes
- D2L Valence API version strings: LP `1.57`, LE `1.74`
- Enrollment type 3 = Course Offering (filter enrollments to this)
- Rate limit handling: exponential backoff on 429 responses
- Token auto-refresh with 5-minute buffer before expiry

## Fallback Plans (if Brightspace API approval is delayed)
- **Fallback A:** Manual upload — users upload syllabi PDFs and grade CSVs
- **Fallback B:** Chrome extension scraper reads Brightspace DOM
- **Fallback C:** Mock data for demo — real architecture, realistic sample data
