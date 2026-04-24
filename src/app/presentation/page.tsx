// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Brain,
  Zap,
  BarChart3,
  MessageSquare,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Database,
  Sparkles,
  Shield,
  Layers,
  GitBranch,
  Cpu,
  Palette,
  Code2,
  CheckCircle2,
  Workflow,
  FileText,
  Users,
  Lock,
  Globe,
  Play,
  Bell,
  Clock,
  GraduationCap,
  AlertTriangle,
  Eye,
  TrendingUp,
  Mail,
  Search,
  Flag,
  Key,
  Server,
  Wifi,
  MousePointer2,
  Terminal,
  Package,
  Target,
  ListChecks,
  Inbox,
  BookMarked,
  Folder,
  Headphones,
  Activity,
  ShieldCheck,
  Hash,
  Smartphone,
  Moon,
  Sun,
  Radio,
} from 'lucide-react';

type SlideProps = { active: boolean };

// ─── Color tokens (derived from globals.css @theme) ───
const COLORS = {
  emerald: 'oklch(0.723 0.191 149.58)', // grade-a / success
  amber: 'oklch(0.795 0.184 86.047)',    // grade-b
  orange: 'oklch(0.705 0.213 47.604)',   // grade-c
  rose: 'oklch(0.637 0.237 25.331)',     // grade-d
  blue: 'oklch(0.62 0.18 250)',
  violet: 'oklch(0.58 0.2 295)',
  cyan: 'oklch(0.72 0.13 210)',
  pink: 'oklch(0.7 0.19 340)',
};

const Brand = () => (
  <p className="text-sm font-mono text-muted-foreground">[beacon]</p>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-mono text-muted-foreground mb-6">{children}</p>
);

// Colored icon tile — circular with soft tinted background and solid colored glyph.
const IconTile = ({
  Icon,
  color,
  size = 'md',
}: {
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const dims = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  const iconDims = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div
      className={`${dims} rounded-full flex items-center justify-center shrink-0`}
      style={{
        backgroundColor: color.replace(')', ' / 0.12)').replace('oklch(', 'oklch('),
        border: `1px solid ${color.replace(')', ' / 0.2)').replace('oklch(', 'oklch(')}`,
      }}
    >
      <Icon className={iconDims} style={{ color }} />
    </div>
  );
};

// Colored chip — used inline for badges / tags.
const Chip = ({
  children,
  color,
  mono = false,
}: {
  children: React.ReactNode;
  color?: string;
  mono?: boolean;
}) => (
  <span
    className={`inline-flex items-center px-3 py-1.5 rounded-full border text-xs ${
      mono ? 'font-mono' : ''
    }`}
    style={
      color
        ? {
            color,
            borderColor: color.replace(')', ' / 0.3)').replace('oklch(', 'oklch('),
            backgroundColor: color.replace(')', ' / 0.08)').replace('oklch(', 'oklch('),
          }
        : { color: 'var(--muted-foreground)', borderColor: 'var(--border)' }
    }
  >
    {children}
  </span>
);

const slideVariants = {
  enter: { opacity: 0, y: 20 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

// ───────── Slide 1: Title ─────────
function TitleSlide({ active }: SlideProps) {
  if (!active) return null;
  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl mx-auto px-6 md:px-12 flex flex-col justify-center h-full"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <p className="text-sm font-mono text-muted-foreground mb-6">[beacon]</p>
        <h1 className="text-5xl md:text-7xl font-light tracking-tight leading-[1.05] mb-6">
          Your academic data,<br />
          <span className="text-muted-foreground">one dashboard away.</span>
        </h1>
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mb-12">
          AI-powered insights from Brightspace, unified into a beautiful dashboard built for Purdue students.
        </p>

        <div className="flex items-center gap-2.5 flex-wrap mb-8">
          <Chip color={COLORS.blue} mono>CNIT 566</Chip>
          <Chip color={COLORS.emerald} mono>Next.js 16</Chip>
          <Chip color={COLORS.violet} mono>Supabase</Chip>
          <Chip color={COLORS.orange} mono>Anthropic</Chip>
          <Chip color={COLORS.cyan} mono>TypeScript</Chip>
          <Chip mono>Apr 2026</Chip>
        </div>

        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" style={{ color: COLORS.emerald }} />
            AI-native
          </span>
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: COLORS.blue }} />
            RLS-isolated
          </span>
          <span className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5" style={{ color: COLORS.orange }} />
            Streaming
          </span>
          <span className="flex items-center gap-2">
            <Smartphone className="w-3.5 h-3.5" style={{ color: COLORS.violet }} />
            Mobile-ready
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ───────── Slide 2: The Problem ─────────
function ProblemSlide({ active }: SlideProps) {
  if (!active) return null;

  const frictions = [
    { icon: BarChart3, color: COLORS.rose, label: 'Grades hidden three clicks deep', sub: 'Open course → grades tab → scroll' },
    { icon: Inbox, color: COLORS.orange, label: 'Assignments scattered per course', sub: 'No cross-course upcoming view' },
    { icon: Clock, color: COLORS.amber, label: 'Deadlines tracked manually', sub: 'Students copy dates into Notion / paper' },
    { icon: Bell, color: COLORS.cyan, label: 'Announcements siloed', sub: 'Must visit every course weekly' },
    { icon: Calendar, color: COLORS.blue, label: 'No weekly workload overview', sub: 'Can&apos;t plan the week at a glance' },
    { icon: MessageSquare, color: COLORS.violet, label: 'Contact info lives in PDFs', sub: 'Office hours buried in syllabi' },
  ];

  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.5 }}
      className="w-full max-w-6xl mx-auto px-6 md:px-12 flex flex-col justify-center h-full"
    >
      <SectionLabel>the problem</SectionLabel>
      <h2 className="text-4xl md:text-5xl font-light tracking-tight leading-[1.1] mb-4 max-w-3xl">
        College dashboards weren&apos;t built<br />
        <span className="text-muted-foreground">for how students actually work.</span>
      </h2>
      <p className="text-muted-foreground leading-relaxed mb-8 max-w-2xl">
        Brightspace is a system of record, not a workspace. Every piece of information lives behind another click.
      </p>

      <div className="flex gap-3 mb-8 flex-wrap">
        <Chip color={COLORS.rose}>
          <AlertTriangle className="w-3 h-3 mr-1.5" /> 4+ clicks to see a grade
        </Chip>
        <Chip color={COLORS.orange}>
          <AlertTriangle className="w-3 h-3 mr-1.5" /> 6 courses × 5 tabs = 30 surfaces
        </Chip>
        <Chip color={COLORS.amber}>
          <AlertTriangle className="w-3 h-3 mr-1.5" /> Zero proactive nudges
        </Chip>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {frictions.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="p-4 rounded-2xl border border-border bg-background/50 flex items-start gap-3"
          >
            <IconTile Icon={f.icon} color={f.color} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight mb-1">{f.label}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ───────── Slide 3: The Solution ─────────
function SolutionSlide({ active }: SlideProps) {
  if (!active) return null;

  const steps = [
    {
      step: '01',
      icon: Wifi,
      color: COLORS.blue,
      title: 'Sync',
      desc: 'Pull courses, assignments, grades, content, announcements from Brightspace Valence API.',
      chips: ['OAuth + DUO', 'Bookmark paging', 'Background job'],
    },
    {
      step: '02',
      icon: Eye,
      color: COLORS.emerald,
      title: 'Surface',
      desc: 'Unified dashboard, calendar, per-course tabs, grade analytics — all powered by local Postgres.',
      chips: ['<100ms reads', 'Offline-capable', 'Mobile-first'],
    },
    {
      step: '03',
      icon: Brain,
      color: COLORS.violet,
      title: 'Ask',
      desc: 'Natural-language queries over structured academic context with streaming token responses.',
      chips: ['SSE streaming', 'Dual-scoped', 'Rate-limited'],
    },
  ];

  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.5 }}
      className="w-full max-w-6xl mx-auto px-6 md:px-12 flex flex-col justify-center h-full"
    >
      <SectionLabel>the solution</SectionLabel>
      <h2 className="text-4xl md:text-5xl font-light tracking-tight leading-[1.1] mb-4 max-w-3xl">
        One surface.<br />
        <span className="text-muted-foreground">Every course. Every deadline. Every answer.</span>
      </h2>
      <p className="text-muted-foreground leading-relaxed mb-10 max-w-2xl">
        Beacon syncs Brightspace into a local-first dashboard and layers AI on top — so the next action is always obvious.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((s, i) => (
          <motion.div
            key={s.step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.1 }}
            className="p-6 rounded-2xl border border-border bg-background"
          >
            <div className="flex items-center gap-3 mb-4">
              <IconTile Icon={s.icon} color={s.color} />
              <p className="text-xs font-mono text-muted-foreground">{s.step}</p>
            </div>
            <p className="text-lg font-medium mb-2">{s.title}</p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{s.desc}</p>
            <div className="flex flex-wrap gap-1.5">
              {s.chips.map((c) => (
                <span
                  key={c}
                  className="text-[10px] font-mono px-2 py-1 rounded-full border border-border text-muted-foreground"
                >
                  {c}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ───────── Slide 4: Features ─────────
function FeaturesSlide({ active }: SlideProps) {
  if (!active) return null;

  const features = [
    {
      icon: Sparkles,
      color: COLORS.emerald,
      title: 'AI daily briefing',
      desc: 'Streaming summaries in 3 sections: due soon, this week, heads-up. Cached per day, <80 words.',
      meta: '/api/briefing · SSE',
    },
    {
      icon: MessageSquare,
      color: COLORS.violet,
      title: 'Ask Beacon',
      desc: 'Chat over full academic context. Global + per-course scopes. History persisted per user.',
      meta: '/api/ask · 20 req/min',
    },
    {
      icon: Calendar,
      color: COLORS.blue,
      title: 'Unified calendar',
      desc: 'Month + week views. Assignment dots color-coded by course. Click to jump to course detail.',
      meta: '/calendar',
    },
    {
      icon: TrendingUp,
      color: COLORS.orange,
      title: 'Grade analytics',
      desc: 'Weighted calculations. Trend detection. AI-generated insight under 80 words on weak spots.',
      meta: '/api/course/grade-insight',
    },
    {
      icon: BookMarked,
      color: COLORS.amber,
      title: 'Content browser',
      desc: 'Hierarchical modules + topics. Direct links out to Brightspace resources.',
      meta: 'content_modules / topics',
    },
    {
      icon: Users,
      color: COLORS.pink,
      title: 'Instructor card',
      desc: 'AI parses announcements to extract name, email, office, and hours into structured JSON.',
      meta: '/api/course/extract-info',
    },
    {
      icon: ListChecks,
      color: COLORS.cyan,
      title: 'Daily checklist',
      desc: 'Auto-populated from upcoming assignments. Custom tasks allowed. Resets every day.',
      meta: 'localStorage scoped by date',
    },
    {
      icon: Bell,
      color: COLORS.rose,
      title: 'Announcements feed',
      desc: 'Cross-course announcement stream. HTML cleaned, ordered by recency.',
      meta: 'announcements table',
    },
  ];

  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.5 }}
      className="w-full max-w-6xl mx-auto px-6 md:px-12 flex flex-col justify-center h-full"
    >
      <SectionLabel>what it does</SectionLabel>
      <h2 className="text-4xl md:text-5xl font-light tracking-tight leading-[1.1] mb-8">
        Eight features.<br />
        <span className="text-muted-foreground">One coherent surface.</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.05 }}
            className="p-4 rounded-2xl border border-border bg-background"
          >
            <IconTile Icon={f.icon} color={f.color} size="sm" />
            <p className="text-sm font-medium mt-3 mb-1.5">{f.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">{f.desc}</p>
            <p className="text-[10px] font-mono text-muted-foreground/70 truncate">{f.meta}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ───────── Slide 5: Tech Stack ─────────
function TechStackSlide({ active }: SlideProps) {
  if (!active) return null;

  const groups = [
    {
      label: 'frontend',
      icon: MousePointer2,
      color: COLORS.blue,
      items: [
        'Next.js 16.1.7 App Router',
        'React 19.2.3',
        'TypeScript 5 (strict)',
        'Tailwind CSS v4',
        'Framer Motion 12',
        'Lucide icons 0.577',
        'Zustand 5 state',
        'react-markdown + GFM',
      ],
    },
    {
      label: 'backend',
      icon: Server,
      color: COLORS.emerald,
      items: [
        'Next.js API routes (21)',
        '@supabase/ssr 0.9',
        '@supabase/supabase-js 2.99',
        'Row-Level Security',
        'SSE async generators',
        'In-memory rate limiter',
        'Middleware auth',
        'Service-role admin client',
      ],
    },
    {
      label: 'data',
      icon: GitBranch,
      color: COLORS.orange,
      items: [
        'Brightspace Valence API',
        'LP version 1.40',
        'LE version 1.74',
        'Bookmark pagination',
        'Enrollment type 3 filter',
        'Playwright 1.58 (DUO)',
        'Exponential backoff on 429',
        '24-hour cookie expiry',
      ],
    },
    {
      label: 'ai',
      icon: Brain,
      color: COLORS.violet,
      items: [
        'Anthropic SDK 0.90',
        'api.anthropic.com endpoint',
        'Claude Haiku 4.5 model',
        'Streaming + non-stream',
        '6 system prompt templates',
        'Structured academic context',
        'Conversation history (10-msg)',
        '10/min & 20/min buckets',
      ],
    },
  ];

  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.5 }}
      className="w-full max-w-6xl mx-auto px-6 md:px-12 flex flex-col justify-center h-full"
    >
      <SectionLabel>tech stack</SectionLabel>
      <h2 className="text-4xl md:text-5xl font-light tracking-tight leading-[1.1] mb-8">
        Modern, typed,<br />
        <span className="text-muted-foreground">no framework sprawl.</span>
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {groups.map((g, i) => (
          <motion.div
            key={g.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="p-5 rounded-2xl border border-border bg-background"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <IconTile Icon={g.icon} color={g.color} size="sm" />
              <p
                className="text-xs font-mono uppercase tracking-wider"
                style={{ color: g.color }}
              >
                {g.label}
              </p>
            </div>
            <ul className="space-y-1.5">
              {g.items.map((item) => (
                <li key={item} className="text-xs leading-relaxed flex items-start gap-2">
                  <span
                    className="w-1 h-1 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: g.color }}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ───────── Slide 6: Architecture ─────────
function ArchitectureSlide({ active }: SlideProps) {
  if (!active) return null;

  const layers = [
    {
      icon: Globe,
      color: COLORS.blue,
      label: 'Browser',
      sub: 'React 19 · Tailwind · Framer Motion',
      detail: 'Server components hydrate on load. Client components for interactive UI.',
    },
    {
      icon: Code2,
      color: COLORS.cyan,
      label: 'Next.js App Router',
      sub: '21 API routes · middleware auth · SSR',
      detail: 'Single deploy. Edge-ready. Streaming SSE endpoints for AI.',
    },
    {
      icon: Cpu,
      color: COLORS.violet,
      label: 'AI layer',
      sub: 'Anthropic streaming + context builder',
      detail: 'buildAcademicContext → system prompt → async generator → SSE stream.',
    },
    {
      icon: Database,
      color: COLORS.emerald,
      label: 'Supabase Postgres',
      sub: '8 tables · RLS on every row',
      detail: 'auth.uid() filter on every query. Service role only for internal jobs.',
    },
    {
      icon: GitBranch,
      color: COLORS.orange,
      label: 'Brightspace Valence',
      sub: 'OAuth + Playwright fallback',
      detail: 'LP 1.40 / LE 1.74. Cookie session. Bookmark pagination loops.',
    },
  ];

  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto px-6 md:px-12 flex flex-col justify-center h-full"
    >
      <SectionLabel>architecture</SectionLabel>
      <h2 className="text-4xl md:text-5xl font-light tracking-tight leading-[1.1] mb-8">
        One codebase.<br />
        <span className="text-muted-foreground">End to end.</span>
      </h2>

      <div className="space-y-2.5">
        {layers.map((l, i) => (
          <motion.div
            key={l.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            className="p-4 rounded-2xl border border-border bg-background flex items-center gap-4"
          >
            <IconTile Icon={l.icon} color={l.color} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{l.label}</p>
              <p className="text-xs text-muted-foreground">{l.sub}</p>
              <p className="text-[11px] text-muted-foreground/70 mt-1 hidden md:block">
                {l.detail}
              </p>
            </div>
            <span
              className="text-xs font-mono shrink-0"
              style={{ color: l.color }}
            >
              0{i + 1}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ───────── Slide 7: Database ─────────
function DatabaseSlide({ active }: SlideProps) {
  if (!active) return null;

  const tables = [
    { icon: Users, color: COLORS.blue, name: 'users', desc: 'Auth + Brightspace tokens + sync progress', rows: '1 / user' },
    { icon: BookOpen, color: COLORS.emerald, name: 'courses', desc: 'Enrollments with current_grade numeric', rows: '~6–8 / user' },
    { icon: FileText, color: COLORS.orange, name: 'assignments', desc: 'Dropbox + quizzes with due_date, points, weight', rows: '~50–200' },
    { icon: Folder, color: COLORS.amber, name: 'content_modules', desc: 'Hierarchical modules, self-referential FK', rows: '~30 / course' },
    { icon: BookMarked, color: COLORS.cyan, name: 'content_topics', desc: 'Individual items inside modules', rows: '~100 / course' },
    { icon: Bell, color: COLORS.rose, name: 'announcements', desc: 'Course news, HTML-cleaned, ordered by date', rows: '~20 / course' },
    { icon: Sparkles, color: COLORS.violet, name: 'briefings', desc: 'Cached AI briefings, unique per user/day', rows: '1 / user / day' },
    { icon: MessageSquare, color: COLORS.pink, name: 'chat_messages', desc: 'Scoped chat (null course_id = global)', rows: 'unbounded' },
  ];

  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl mx-auto px-6 md:px-12 flex flex-col justify-center h-full"
    >
      <SectionLabel>database schema</SectionLabel>
      <h2 className="text-4xl md:text-5xl font-light tracking-tight leading-[1.1] mb-4">
        Eight tables.<br />
        <span className="text-muted-foreground">RLS on every row.</span>
      </h2>
      <p className="text-muted-foreground leading-relaxed mb-6 max-w-2xl">
        Every row is scoped to <span className="font-mono text-foreground">auth.uid()</span>. The database enforces isolation — the API layer can&apos;t leak data even if it tries.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        <Chip color={COLORS.emerald}>
          <ShieldCheck className="w-3 h-3 mr-1.5" /> RLS enforced
        </Chip>
        <Chip color={COLORS.blue}>
          <Hash className="w-3 h-3 mr-1.5" /> 6 indexes
        </Chip>
        <Chip color={COLORS.violet}>
          <Database className="w-3 h-3 mr-1.5" /> 2 migrations
        </Chip>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {tables.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.04 }}
            className="p-3 rounded-2xl border border-border bg-background flex items-center gap-3"
          >
            <IconTile Icon={t.icon} color={t.color} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-mono" style={{ color: t.color }}>{t.name}</p>
              <p className="text-xs text-muted-foreground truncate">{t.desc}</p>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground/70 shrink-0">
              {t.rows}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ───────── Slide 8: AI Features ─────────
function AISlide({ active }: SlideProps) {
  if (!active) return null;

  const cards = [
    {
      icon: Zap,
      color: COLORS.amber,
      title: 'Streaming SSE',
      body: 'Async generators wrapped in Server-Sent Events. Tokens stream token-by-token to the browser — no blank wait, no buffering.',
      tag: 'streamToSSEResponse()',
    },
    {
      icon: Brain,
      color: COLORS.violet,
      title: 'Structured context',
      body: 'buildAcademicContext() formats courses, upcoming work, recent grades, and announcements into markdown sections before prompting.',
      tag: 'src/lib/ai/prompts.ts',
    },
    {
      icon: Layers,
      color: COLORS.blue,
      title: 'Dual-scoped chat',
      body: 'chat_messages.course_id IS NULL for global; set for per-course. Same table, same RLS — different scope via partial index.',
      tag: 'idx_chat_messages_global',
    },
    {
      icon: FileText,
      color: COLORS.emerald,
      title: 'Six specialized prompts',
      body: 'Briefing · NLQ · course-NLQ · assignment analysis · grade insight · summarization — each tuned under a strict word budget.',
      tag: '171 lines of prompt eng.',
    },
    {
      icon: Target,
      color: COLORS.orange,
      title: 'Tight word budgets',
      body: 'Briefings < 80 words. NLQ < 100 unless a table is needed. Grade insight < 80. Forces the model to be useful, not verbose.',
      tag: 'system prompt constraints',
    },
    {
      icon: Flag,
      color: COLORS.rose,
      title: 'Rate limits',
      body: 'Per-user, per-endpoint buckets in memory. Briefing 10/min, Ask 20/min. Auto-cleanup every 60s. Zero DB calls.',
      tag: 'lib/rateLimit.ts',
    },
  ];

  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.5 }}
      className="w-full max-w-6xl mx-auto px-6 md:px-12 flex flex-col justify-center h-full"
    >
      <SectionLabel>ai layer</SectionLabel>
      <h2 className="text-4xl md:text-5xl font-light tracking-tight leading-[1.1] mb-8">
        Not a chatbot wrapper.<br />
        <span className="text-muted-foreground">A context engine.</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {cards.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
            className="p-5 rounded-2xl border border-border bg-background"
          >
            <IconTile Icon={c.icon} color={c.color} size="sm" />
            <p className="text-sm font-medium mt-3 mb-2">{c.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">{c.body}</p>
            <p
              className="text-[10px] font-mono px-2 py-1 rounded-full inline-block"
              style={{
                color: c.color,
                backgroundColor: c.color.replace(')', ' / 0.08)').replace('oklch(', 'oklch('),
              }}
            >
              {c.tag}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ───────── Slide 9: Code snippet (NEW) ─────────
function CodeSlide({ active }: SlideProps) {
  if (!active) return null;

  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl mx-auto px-6 md:px-12 flex flex-col justify-center h-full"
    >
      <SectionLabel>streaming pattern</SectionLabel>
      <h2 className="text-3xl md:text-4xl font-light tracking-tight leading-[1.1] mb-6">
        Async generator<br />
        <span className="text-muted-foreground">→ Server-Sent Events.</span>
      </h2>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border bg-background overflow-hidden"
      >
        <div className="px-4 py-2.5 border-b border-border flex items-center gap-2 bg-muted/30">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.rose }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.amber }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.emerald }} />
          </div>
          <p className="text-[11px] font-mono text-muted-foreground ml-2">
            src/lib/ai/client.ts
          </p>
          <Terminal className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
        </div>
        <pre className="p-5 text-[11px] md:text-xs font-mono leading-relaxed overflow-x-auto">
          <code>
            <span style={{ color: COLORS.violet }}>export async function*</span>{' '}
            <span style={{ color: COLORS.blue }}>generateCompletionStream</span>
            (systemPrompt, userMessage) {'{'}
            {'\n  '}
            <span style={{ color: COLORS.violet }}>const</span> stream ={' '}
            <span style={{ color: COLORS.violet }}>await</span> anthropic.messages.stream({'{'}
            {'\n    '}
            model: <span style={{ color: COLORS.emerald }}>&apos;claude-haiku-4-5&apos;</span>,
            {'\n    '}
            max_tokens: <span style={{ color: COLORS.orange }}>2000</span>,
            {'\n    '}
            system: systemPrompt,
            {'\n    '}
            messages: [{'{'} role: <span style={{ color: COLORS.emerald }}>&apos;user&apos;</span>, content: userMessage {'}'}],
            {'\n  '}
            {'}'});
            {'\n\n  '}
            <span style={{ color: COLORS.violet }}>for await</span> (<span style={{ color: COLORS.violet }}>const</span> event{' '}
            <span style={{ color: COLORS.violet }}>of</span> stream) {'{'}
            {'\n    '}
            <span style={{ color: COLORS.violet }}>if</span> (event.type === <span style={{ color: COLORS.emerald }}>&apos;content_block_delta&apos;</span>){' '}
            <span style={{ color: COLORS.violet }}>yield</span> event.delta.text;{' '}
            <span style={{ color: 'var(--muted-foreground)', opacity: 0.7 }}>{'// one token per yield'}</span>
            {'\n  '}
            {'}'}
            {'\n'}
            {'}'}
            {'\n\n'}
            <span style={{ color: COLORS.violet }}>export function</span>{' '}
            <span style={{ color: COLORS.blue }}>streamToSSEResponse</span>(generator) {'{'}
            {'\n  '}
            <span style={{ color: COLORS.violet }}>const</span> encoder ={' '}
            <span style={{ color: COLORS.violet }}>new</span> TextEncoder();
            {'\n  '}
            <span style={{ color: COLORS.violet }}>const</span> readable ={' '}
            <span style={{ color: COLORS.violet }}>new</span> ReadableStream({'{'}
            {'\n    '}
            <span style={{ color: COLORS.blue }}>async start</span>(controller) {'{'}
            {'\n      '}
            <span style={{ color: COLORS.violet }}>for await</span> (<span style={{ color: COLORS.violet }}>const</span> token{' '}
            <span style={{ color: COLORS.violet }}>of</span> generator) {'{'}
            {'\n        '}
            controller.enqueue(encoder.encode(`data: ${'${'}<span style={{ color: COLORS.orange }}>JSON</span>.stringify({'{'} content: token {'}'}){'}'}\n\n`));
            {'\n      '}
            {'}'}
            {'\n      '}
            controller.enqueue(encoder.encode(<span style={{ color: COLORS.emerald }}>&apos;data: [DONE]\n\n&apos;</span>));
            {'\n      '}
            controller.close();
            {'\n    '}
            {'}'},
            {'\n  '}
            {'}'});
            {'\n  '}
            <span style={{ color: COLORS.violet }}>return new</span> Response(readable, {'{'} headers: {'{'}{' '}
            <span style={{ color: COLORS.emerald }}>&apos;Content-Type&apos;</span>:{' '}
            <span style={{ color: COLORS.emerald }}>&apos;text/event-stream&apos;</span> {'}'} {'}'});
            {'\n'}
            {'}'}
          </code>
        </pre>
      </motion.div>

      <p className="text-xs text-muted-foreground mt-4">
        One helper. Reused by <span className="font-mono text-foreground">/api/briefing</span>,{' '}
        <span className="font-mono text-foreground">/api/ask</span>, and{' '}
        <span className="font-mono text-foreground">/api/course/grade-insight</span>.
      </p>
    </motion.div>
  );
}

// ───────── Slide 10: Brightspace Integration ─────────
function BrightspaceSlide({ active }: SlideProps) {
  if (!active) return null;

  const steps = [
    {
      n: '01',
      icon: Key,
      color: COLORS.violet,
      label: 'Auth',
      desc: 'Playwright captures session cookies through DUO 2FA. 24-hour expiry window.',
    },
    {
      n: '02',
      icon: BookOpen,
      color: COLORS.blue,
      label: 'Enrollments',
      desc: 'Filter to Type 3 (Course Offering). Bookmark-paginated via PagingInfo.HasMoreItems loop.',
    },
    {
      n: '03',
      icon: Layers,
      color: COLORS.emerald,
      label: 'Per course',
      desc: 'Dropbox folders + quizzes + grade values + final grade + content tree + announcements.',
    },
    {
      n: '04',
      icon: Database,
      color: COLORS.amber,
      label: 'Persist',
      desc: 'Upsert into Supabase. Progress written to users.sync_progress jsonb. Polled from UI.',
    },
    {
      n: '05',
      icon: Activity,
      color: COLORS.orange,
      label: 'Resilience',
      desc: 'Exponential backoff on 429. 302→login redirect detected as session expiry. 3 retries.',
    },
  ];

  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl mx-auto px-6 md:px-12 flex flex-col justify-center h-full"
    >
      <SectionLabel>brightspace integration</SectionLabel>
      <h2 className="text-4xl md:text-5xl font-light tracking-tight leading-[1.1] mb-4">
        OAuth, pagination,<br />
        <span className="text-muted-foreground">and a headless browser fallback.</span>
      </h2>
      <p className="text-muted-foreground leading-relaxed mb-6 max-w-2xl">
        Purdue Brightspace requires DUO 2FA. When OAuth isn&apos;t approved, a Playwright flow captures session cookies server-side.
      </p>

      <div className="flex gap-2 mb-6 flex-wrap">
        <Chip color={COLORS.blue} mono>LP v1.40</Chip>
        <Chip color={COLORS.violet} mono>LE v1.74</Chip>
        <Chip color={COLORS.emerald} mono>OAuth 2.0</Chip>
        <Chip color={COLORS.orange} mono>Bookmark paging</Chip>
        <Chip color={COLORS.rose} mono>Playwright fallback</Chip>
      </div>

      <div className="space-y-2.5">
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="p-4 rounded-2xl border border-border bg-background flex items-center gap-4"
          >
            <span className="text-xs font-mono text-muted-foreground w-6 shrink-0">{s.n}</span>
            <IconTile Icon={s.icon} color={s.color} size="sm" />
            <p className="text-sm font-medium w-28 shrink-0" style={{ color: s.color }}>
              {s.label}
            </p>
            <p className="text-xs text-muted-foreground flex-1">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ───────── Slide 11: Security (NEW) ─────────
function SecuritySlide({ active }: SlideProps) {
  if (!active) return null;

  const layers = [
    {
      icon: ShieldCheck,
      color: COLORS.emerald,
      title: 'Row-Level Security',
      desc: 'Every table has a policy: id = auth.uid(). Enforced by Postgres — API bugs can&apos;t leak cross-user data.',
      example: 'USING (user_id = auth.uid())',
    },
    {
      icon: Key,
      color: COLORS.blue,
      title: 'Token storage',
      desc: 'Brightspace session cookies stored server-side, never exposed to the client. Service-role key only on the server.',
      example: 'users.brightspace_session_cookies (jsonb)',
    },
    {
      icon: Flag,
      color: COLORS.orange,
      title: 'Rate limiting',
      desc: 'Per-user, per-endpoint. 10/min briefing, 20/min ask. Prevents LLM cost blowouts and abuse.',
      example: 'checkRateLimit(userId, endpoint)',
    },
    {
      icon: Lock,
      color: COLORS.violet,
      title: 'Auth middleware',
      desc: 'Every API route validates Supabase JWT before touching data. Anonymous requests are rejected at the edge.',
      example: 'middleware.ts',
    },
    {
      icon: Eye,
      color: COLORS.rose,
      title: 'No secret leakage',
      desc: 'Environment variables for all credentials. .env.local gitignored. No keys in client bundles.',
      example: '.env.local + NEXT_PUBLIC_ prefix',
    },
    {
      icon: Clock,
      color: COLORS.amber,
      title: 'Session expiry',
      desc: 'Brightspace cookies checked for 24-hour window. Expired sessions force re-auth with clear UI.',
      example: 'getValidToken(userId)',
    },
  ];

  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.5 }}
      className="w-full max-w-6xl mx-auto px-6 md:px-12 flex flex-col justify-center h-full"
    >
      <SectionLabel>security &amp; isolation</SectionLabel>
      <h2 className="text-4xl md:text-5xl font-light tracking-tight leading-[1.1] mb-8">
        Defense in depth.<br />
        <span className="text-muted-foreground">Postgres as the last line.</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {layers.map((l, i) => (
          <motion.div
            key={l.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="p-5 rounded-2xl border border-border bg-background"
          >
            <IconTile Icon={l.icon} color={l.color} size="sm" />
            <p className="text-sm font-medium mt-3 mb-2">{l.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">{l.desc}</p>
            <p
              className="text-[10px] font-mono px-2 py-1 rounded-full inline-block"
              style={{
                color: l.color,
                backgroundColor: l.color.replace(')', ' / 0.08)').replace('oklch(', 'oklch('),
              }}
            >
              {l.example}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ───────── Slide 12: Surfaces (NEW) ─────────
function SurfacesSlide({ active }: SlideProps) {
  if (!active) return null;

  const pages = [
    { icon: Activity, color: COLORS.blue, route: '/dashboard', label: 'Dashboard', desc: 'Briefing, checklist, deadlines, recent updates.' },
    { icon: BookOpen, color: COLORS.emerald, route: '/course/[id]', label: 'Course detail', desc: '7 tabs: overview, assignments, grades, calendar, content, chat, announcements.' },
    { icon: MessageSquare, color: COLORS.violet, route: '/ask', label: 'Ask Beacon', desc: 'Global streaming chat with suggestion pills + history.' },
    { icon: Calendar, color: COLORS.orange, route: '/calendar', label: 'Calendar', desc: 'Month + week views with color-coded assignment dots.' },
    { icon: Lock, color: COLORS.amber, route: '/settings', label: 'Settings', desc: 'Theme, Brightspace auth, data export, notifications.' },
    { icon: Headphones, color: COLORS.pink, route: '/', label: 'Landing', desc: 'Auth form with feature showcase and animated background.' },
  ];

  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl mx-auto px-6 md:px-12 flex flex-col justify-center h-full"
    >
      <SectionLabel>product surfaces</SectionLabel>
      <h2 className="text-4xl md:text-5xl font-light tracking-tight leading-[1.1] mb-8">
        Six routes.<br />
        <span className="text-muted-foreground">Every student task covered.</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {pages.map((p, i) => (
          <motion.div
            key={p.route}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="p-4 rounded-2xl border border-border bg-background flex items-center gap-3"
          >
            <IconTile Icon={p.icon} color={p.color} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium">{p.label}</p>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                  style={{
                    color: p.color,
                    backgroundColor: p.color.replace(')', ' / 0.08)').replace('oklch(', 'oklch('),
                  }}
                >
                  {p.route}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ───────── Slide 13: Design System ─────────
function DesignSlide({ active }: SlideProps) {
  if (!active) return null;

  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.5 }}
      className="w-full max-w-6xl mx-auto px-6 md:px-12 flex flex-col justify-center h-full"
    >
      <SectionLabel>design system</SectionLabel>
      <h2 className="text-4xl md:text-5xl font-light tracking-tight leading-[1.1] mb-8">
        Monochrome-first.<br />
        <span className="text-muted-foreground">Content is the color.</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Palette */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-2xl border border-border bg-background"
        >
          <IconTile Icon={Palette} color={COLORS.rose} size="sm" />
          <p className="text-sm font-medium mt-3 mb-3">Palette</p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
            oklch achromatic. Zero chroma in the base. Grade colors for semantic accent only.
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            <div className="aspect-square rounded-full border border-border bg-foreground" />
            <div className="aspect-square rounded-full border border-border bg-muted" />
            <div className="aspect-square rounded-full border border-border" style={{ backgroundColor: COLORS.emerald }} />
            <div className="aspect-square rounded-full border border-border" style={{ backgroundColor: COLORS.amber }} />
            <div className="aspect-square rounded-full border border-border" style={{ backgroundColor: COLORS.orange }} />
            <div className="aspect-square rounded-full border border-border" style={{ backgroundColor: COLORS.rose }} />
            <div className="aspect-square rounded-full border border-border" style={{ backgroundColor: COLORS.blue }} />
            <div className="aspect-square rounded-full border border-border" style={{ backgroundColor: COLORS.violet }} />
          </div>
        </motion.div>

        {/* Typography */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="p-5 rounded-2xl border border-border bg-background"
        >
          <IconTile Icon={FileText} color={COLORS.blue} size="sm" />
          <p className="text-sm font-medium mt-3 mb-3">Typography</p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
            System fonts. font-light headlines. font-mono brand + labels. Never bold.
          </p>
          <p className="text-3xl font-light leading-none">Aa</p>
          <p className="text-xs font-mono text-muted-foreground mt-2">[beacon]</p>
          <p className="text-[10px] font-mono text-muted-foreground mt-1">300 · 400 · 500</p>
        </motion.div>

        {/* Components */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
          className="p-5 rounded-2xl border border-border bg-background"
        >
          <IconTile Icon={Layers} color={COLORS.violet} size="sm" />
          <p className="text-sm font-medium mt-3 mb-3">Components</p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
            Pills everywhere. rounded-2xl cards. Soft focus rings. No resting shadow.
          </p>
          <div className="flex flex-col gap-2">
            <button className="py-2 px-4 rounded-full bg-foreground text-background text-xs font-medium">
              Primary
            </button>
            <button className="py-2 px-4 rounded-full border border-border text-xs font-medium">
              Ghost
            </button>
          </div>
        </motion.div>

        {/* Motion */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34 }}
          className="p-5 rounded-2xl border border-border bg-background"
        >
          <IconTile Icon={Activity} color={COLORS.emerald} size="sm" />
          <p className="text-sm font-medium mt-3 mb-3">Motion</p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
            Framer Motion. Entrance y=20 once. Hover scale 1.02 on buttons, y=-8 on cards.
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Moon className="w-3.5 h-3.5" style={{ color: COLORS.violet }} />
            <Sun className="w-3.5 h-3.5" style={{ color: COLORS.amber }} />
            <Smartphone className="w-3.5 h-3.5" style={{ color: COLORS.blue }} />
            <span className="text-[10px] font-mono">3 themes</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ───────── Slide 14: Project Stats ─────────
function StatsSlide({ active }: SlideProps) {
  if (!active) return null;

  const stats = [
    { value: '89', label: 'TypeScript files', icon: Code2, color: COLORS.blue },
    { value: '21', label: 'API route handlers', icon: Server, color: COLORS.emerald },
    { value: '18', label: 'React components', icon: Package, color: COLORS.violet },
    { value: '8', label: 'database tables', icon: Database, color: COLORS.orange },
    { value: '6', label: 'AI prompt templates', icon: Brain, color: COLORS.rose },
    { value: '15', label: 'Brightspace endpoints', icon: GitBranch, color: COLORS.amber },
    { value: '3', label: 'streaming SSE routes', icon: Zap, color: COLORS.cyan },
    { value: '2', label: 'auth flows', icon: Lock, color: COLORS.pink },
  ];

  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.5 }}
      className="w-full max-w-6xl mx-auto px-6 md:px-12 flex flex-col justify-center h-full"
    >
      <SectionLabel>by the numbers</SectionLabel>
      <h2 className="text-4xl md:text-5xl font-light tracking-tight leading-[1.1] mb-8">
        What&apos;s inside.
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.06 }}
            className="p-5 rounded-2xl border border-border bg-background"
          >
            <div className="flex items-start justify-between mb-3">
              <IconTile Icon={s.icon} color={s.color} size="sm" />
            </div>
            <p
              className="text-4xl md:text-5xl font-light tracking-tight mb-2"
              style={{ color: s.color }}
            >
              {s.value}
            </p>
            <p className="text-xs font-mono text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ───────── Slide 15: User Journey ─────────
function JourneySlide({ active }: SlideProps) {
  if (!active) return null;

  const steps = [
    { icon: Shield, color: COLORS.blue, label: 'Sign in', desc: 'Supabase auth — email, password, or Google SSO.', time: '<10s' },
    { icon: Lock, color: COLORS.violet, label: 'Connect Brightspace', desc: 'Browser-based DUO 2FA. Cookies stored server-side.', time: '~30s' },
    { icon: Workflow, color: COLORS.orange, label: 'Initial sync', desc: 'Courses, assignments, grades, content, announcements.', time: '~60s' },
    { icon: Sparkles, color: COLORS.emerald, label: 'Daily briefing', desc: 'AI streams a personalized summary on dashboard load.', time: '<3s' },
    { icon: MessageSquare, color: COLORS.pink, label: 'Ask anything', desc: 'Scoped chat over real academic data.', time: 'real-time' },
  ];

  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl mx-auto px-6 md:px-12 flex flex-col justify-center h-full"
    >
      <SectionLabel>user journey</SectionLabel>
      <h2 className="text-4xl md:text-5xl font-light tracking-tight leading-[1.1] mb-8">
        From zero to briefing<br />
        <span className="text-muted-foreground">in under two minutes.</span>
      </h2>

      <div className="space-y-2.5">
        {steps.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="p-4 rounded-2xl border border-border bg-background flex items-center gap-4"
          >
            <IconTile Icon={s.icon} color={s.color} />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <p className="text-sm font-medium">{s.label}</p>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                  style={{
                    color: s.color,
                    backgroundColor: s.color.replace(')', ' / 0.08)').replace('oklch(', 'oklch('),
                  }}
                >
                  {s.time}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
            <span className="text-xs font-mono text-muted-foreground hidden md:block">
              step {i + 1}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ───────── Slide 16: What's Novel ─────────
function NovelSlide({ active }: SlideProps) {
  if (!active) return null;

  const items = [
    {
      icon: Zap,
      color: COLORS.amber,
      title: 'Streaming SSE from async generators',
      desc: 'AI completions wrapped in a single streamToSSEResponse() helper — reused across briefing, ask, grade-insight.',
    },
    {
      icon: Layers,
      color: COLORS.blue,
      title: 'Dual-scoped chat via nullable FK',
      desc: 'course_id IS NULL for global chat, set for per-course. Partial indexes on both. One table, zero branching.',
    },
    {
      icon: Brain,
      color: COLORS.violet,
      title: 'Structured context builder',
      desc: 'User data → markdown sections → system prompt. The model sees clean, scoped context instead of raw JSON dumps.',
    },
    {
      icon: Search,
      color: COLORS.emerald,
      title: 'AI as a data extractor',
      desc: 'Professor card uses LLM to extract structured JSON (name, email, office, hours) from unstructured announcements.',
    },
    {
      icon: MousePointer2,
      color: COLORS.orange,
      title: 'Playwright as an auth fallback',
      desc: 'When OAuth approval stalls, a headless browser captures the session through DUO so the product still ships.',
    },
    {
      icon: GraduationCap,
      color: COLORS.rose,
      title: 'Grade-aware semantic palette',
      desc: 'Theme defines grade-a through grade-d as oklch colors. A-grade = emerald, D = red. Semantic, not decorative.',
    },
  ];

  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.5 }}
      className="w-full max-w-6xl mx-auto px-6 md:px-12 flex flex-col justify-center h-full"
    >
      <SectionLabel>what&apos;s interesting</SectionLabel>
      <h2 className="text-4xl md:text-5xl font-light tracking-tight leading-[1.1] mb-8">
        Six decisions<br />
        <span className="text-muted-foreground">worth pointing out.</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {items.map((it, i) => (
          <motion.div
            key={it.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="p-5 rounded-2xl border border-border bg-background"
          >
            <div className="flex items-center gap-2 mb-3">
              <IconTile Icon={it.icon} color={it.color} size="sm" />
              <CheckCircle2 className="w-4 h-4" style={{ color: COLORS.emerald }} />
            </div>
            <p className="text-sm font-medium mb-2">{it.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{it.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ───────── Slide 17: Roadmap / Fallbacks ─────────
function RoadmapSlide({ active }: SlideProps) {
  if (!active) return null;

  const nearTerm = [
    { icon: Bell, color: COLORS.blue, label: 'Push notifications for due-soon work' },
    { icon: FileText, color: COLORS.emerald, label: 'PDF syllabus upload + summary' },
    { icon: TrendingUp, color: COLORS.violet, label: 'Weekly retrospective briefing' },
    { icon: Smartphone, color: COLORS.orange, label: 'iOS PWA home-screen polish' },
    { icon: Mail, color: COLORS.rose, label: 'Email digest opt-in' },
  ];

  const fallbacks = [
    { icon: FileText, color: COLORS.amber, label: 'A — manual CSV / PDF upload' },
    { icon: Package, color: COLORS.cyan, label: 'B — Chrome-extension DOM scraper' },
    { icon: Play, color: COLORS.pink, label: 'C — mock-data demo path' },
  ];

  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl mx-auto px-6 md:px-12 flex flex-col justify-center h-full"
    >
      <SectionLabel>what&apos;s next</SectionLabel>
      <h2 className="text-4xl md:text-5xl font-light tracking-tight leading-[1.1] mb-8">
        Ship, measure,<br />
        <span className="text-muted-foreground">then expand scope.</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-border bg-background">
          <p className="text-xs font-mono uppercase tracking-wider mb-4" style={{ color: COLORS.blue }}>
            near term
          </p>
          <ul className="space-y-2.5">
            {nearTerm.map((n) => (
              <li key={n.label} className="flex items-center gap-3 text-sm">
                <IconTile Icon={n.icon} color={n.color} size="sm" />
                <span>{n.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-5 rounded-2xl border border-border bg-background">
          <p className="text-xs font-mono uppercase tracking-wider mb-4" style={{ color: COLORS.orange }}>
            fallback plans
          </p>
          <ul className="space-y-2.5">
            {fallbacks.map((f) => (
              <li key={f.label} className="flex items-center gap-3 text-sm">
                <IconTile Icon={f.icon} color={f.color} size="sm" />
                <span>{f.label}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
            Every fallback keeps the same architecture — only the data source changes. The AI layer, DB schema, and UI all stay identical.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ───────── Slide 18: Thank You ─────────
function ThankYouSlide({ active }: SlideProps) {
  if (!active) return null;

  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto px-6 md:px-12 flex flex-col justify-center h-full"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <p className="text-sm font-mono text-muted-foreground mb-6">[beacon]</p>
        <h2 className="text-5xl md:text-7xl font-light tracking-tight leading-[1.05] mb-6">
          Thank you.<br />
          <span className="text-muted-foreground">Questions?</span>
        </h2>
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mb-10">
          Try it at <span className="font-mono text-foreground">/dashboard</span> · ask it at <span className="font-mono text-foreground">/ask</span>
        </p>

        <div className="flex items-center gap-3 flex-wrap mb-10">
          <a
            href="/dashboard"
            className="py-3 px-6 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5" />
            Open dashboard
          </a>
          <a
            href="/ask"
            className="py-3 px-6 rounded-full border border-border text-sm font-medium hover:bg-muted/50 transition-colors inline-flex items-center gap-2"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Ask Beacon
          </a>
          <a
            href="/calendar"
            className="py-3 px-6 rounded-full border border-border text-sm font-medium hover:bg-muted/50 transition-colors inline-flex items-center gap-2"
          >
            <Calendar className="w-3.5 h-3.5" />
            See calendar
          </a>
        </div>

        <div className="flex items-center gap-5 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" style={{ color: COLORS.emerald }} />
            AI-native
          </span>
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: COLORS.blue }} />
            RLS-isolated
          </span>
          <span className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5" style={{ color: COLORS.orange }} />
            Streaming
          </span>
          <span className="flex items-center gap-2">
            <Smartphone className="w-3.5 h-3.5" style={{ color: COLORS.violet }} />
            Mobile-ready
          </span>
          <span className="flex items-center gap-2">
            <GraduationCap className="w-3.5 h-3.5" style={{ color: COLORS.pink }} />
            Built for Purdue
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ───────── Main presentation component ─────────
const slides = [
  { id: 'title', Component: TitleSlide, label: 'title' },
  { id: 'problem', Component: ProblemSlide, label: 'problem' },
  { id: 'solution', Component: SolutionSlide, label: 'solution' },
  { id: 'features', Component: FeaturesSlide, label: 'features' },
  { id: 'stack', Component: TechStackSlide, label: 'stack' },
  { id: 'architecture', Component: ArchitectureSlide, label: 'architecture' },
  { id: 'database', Component: DatabaseSlide, label: 'database' },
  { id: 'ai', Component: AISlide, label: 'ai' },
  { id: 'code', Component: CodeSlide, label: 'code' },
  { id: 'brightspace', Component: BrightspaceSlide, label: 'brightspace' },
  { id: 'security', Component: SecuritySlide, label: 'security' },
  { id: 'surfaces', Component: SurfacesSlide, label: 'surfaces' },
  { id: 'design', Component: DesignSlide, label: 'design' },
  { id: 'stats', Component: StatsSlide, label: 'stats' },
  { id: 'journey', Component: JourneySlide, label: 'journey' },
  { id: 'novel', Component: NovelSlide, label: 'novel' },
  { id: 'roadmap', Component: RoadmapSlide, label: 'roadmap' },
  { id: 'end', Component: ThankYouSlide, label: 'end' },
];

export default function PresentationPage() {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => {
    setIndex((i) => Math.min(i + 1, slides.length - 1));
  }, []);

  const prev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prev();
      } else if (e.key === 'Home') {
        setIndex(0);
      } else if (e.key === 'End') {
        setIndex(slides.length - 1);
      } else if (/^[1-9]$/.test(e.key)) {
        const target = parseInt(e.key, 10) - 1;
        if (target < slides.length) setIndex(target);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  const current = slides[index];
  const CurrentSlide = current.Component;

  return (
    <div className="h-[100dvh] w-full bg-background relative overflow-hidden flex flex-col">
      {/* Animated background blobs (same as landing page) */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-primary/5 blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-primary/5 blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Top bar — brand + counter */}
      <div className="absolute top-0 left-0 right-0 z-10 px-6 md:px-10 py-5 flex items-center justify-between">
        <Brand />
        <p className="text-xs font-mono text-muted-foreground tracking-wider">
          {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
          <span className="mx-3 opacity-40">·</span>
          <span>{current.label}</span>
        </p>
      </div>

      {/* Slide viewport */}
      <div className="flex-1 flex items-center justify-center relative pt-14 pb-16">
        <AnimatePresence mode="wait">
          <div key={current.id} className="w-full h-full flex items-center">
            <CurrentSlide active />
          </div>
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-6 md:px-10 py-5 flex items-center justify-between gap-4">
        <motion.button
          onClick={prev}
          disabled={index === 0}
          whileHover={{ scale: index === 0 ? 1 : 1.02 }}
          whileTap={{ scale: index === 0 ? 1 : 0.98 }}
          className="w-10 h-10 rounded-full border border-border flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted/50 transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4" />
        </motion.button>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none max-w-[70%]">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIndex(i)}
              className="group shrink-0 py-2"
              aria-label={`Go to slide ${i + 1}: ${s.label}`}
            >
              <span
                className={`block h-1 rounded-full transition-all ${
                  i === index
                    ? 'w-8 bg-foreground'
                    : i < index
                    ? 'w-1.5 bg-muted-foreground/60 group-hover:bg-foreground/80'
                    : 'w-1.5 bg-border group-hover:bg-muted-foreground/60'
                }`}
              />
            </button>
          ))}
        </div>

        <motion.button
          onClick={next}
          disabled={index === slides.length - 1}
          whileHover={{ scale: index === slides.length - 1 ? 1 : 1.02 }}
          whileTap={{ scale: index === slides.length - 1 ? 1 : 0.98 }}
          className="w-10 h-10 rounded-full border border-border flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted/50 transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}
