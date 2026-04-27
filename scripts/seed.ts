// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

// Seeds the local SQLite database with a realistic Purdue-flavored demo
// account. Idempotent — running again is a no-op once the demo user exists.
//
//   npm run db:seed
//   then sign in with  demo@purdue.edu  /  purdue123

import { randomUUID } from 'node:crypto';
import { db, ensureReady } from '@/lib/db/client';
import {
  users,
  courses,
  assignments,
  content_modules,
  content_topics,
  announcements,
} from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth/password';
import { eq } from 'drizzle-orm';

const DEMO_EMAIL = 'demo@purdue.edu';
const DEMO_PASSWORD = 'purdue123';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date();
const semesterStart = new Date(NOW.getTime() - 60 * DAY);
const semesterEnd = new Date(NOW.getTime() + 60 * DAY);

function daysFromNow(d: number): Date {
  return new Date(NOW.getTime() + d * DAY);
}

const COURSES_DATA = [
  {
    code: 'CNIT 566',
    name: 'Database and Data Management',
    grade: 91.4,
    org: 1001,
  },
  {
    code: 'CNIT 415',
    name: 'Information Security and Risk Management',
    grade: 87.1,
    org: 1002,
  },
  {
    code: 'CNIT 481',
    name: 'Cybersecurity Capstone',
    grade: 83.6,
    org: 1003,
  },
  {
    code: 'CGT 270',
    name: 'Foundations of Web Development',
    grade: 94.0,
    org: 1004,
  },
  {
    code: 'MA 261',
    name: 'Multivariate Calculus',
    grade: 76.8,
    org: 1005,
  },
  {
    code: 'COM 217',
    name: 'Science Writing and Presentation',
    grade: 88.3,
    org: 1006,
  },
] as const;

const ASSIGNMENTS_BY_COURSE: Record<
  string,
  Array<{
    name: string;
    type: 'dropbox' | 'quiz';
    dueIn: number;
    points: number;
    earned?: number; // omit for not-yet-graded / future
    weight?: number;
    instructions?: string;
  }>
> = {
  '1001': [
    { name: 'Lab 1 — ER diagrams', type: 'dropbox', dueIn: -42, points: 50, earned: 47, weight: 5 },
    { name: 'Quiz 1 — Relational model', type: 'quiz', dueIn: -35, points: 25, earned: 23, weight: 3 },
    { name: 'Lab 2 — SQL fundamentals', type: 'dropbox', dueIn: -28, points: 50, earned: 49, weight: 5 },
    { name: 'Lab 3 — Joins & subqueries', type: 'dropbox', dueIn: -21, points: 50, earned: 44, weight: 5 },
    { name: 'Midterm exam', type: 'quiz', dueIn: -14, points: 100, earned: 89, weight: 20 },
    { name: 'Lab 4 — Normalization', type: 'dropbox', dueIn: -7, points: 50, earned: 50, weight: 5 },
    { name: 'Lab 5 — Indexing & performance', type: 'dropbox', dueIn: 2, points: 50, weight: 5,
      instructions: 'Build the index strategy for the bookings schema. Submit explain plans before/after.' },
    { name: 'Final project — Beacon', type: 'dropbox', dueIn: 14, points: 200, weight: 30,
      instructions: 'Local-first academic dashboard. Submit GitHub link and a 5-minute demo video.' },
    { name: 'Quiz 4 — Transactions', type: 'quiz', dueIn: 5, points: 25, weight: 3 },
  ],
  '1002': [
    { name: 'Reading 1 — NIST CSF', type: 'dropbox', dueIn: -38, points: 20, earned: 18, weight: 2 },
    { name: 'Lab — Threat modeling', type: 'dropbox', dueIn: -24, points: 75, earned: 68, weight: 8 },
    { name: 'Quiz 2 — Risk register', type: 'quiz', dueIn: -17, points: 30, earned: 27, weight: 4 },
    { name: 'Case study — SolarWinds', type: 'dropbox', dueIn: -10, points: 80, earned: 72, weight: 10 },
    { name: 'Lab — Tabletop exercise', type: 'dropbox', dueIn: 4, points: 100, weight: 12,
      instructions: 'Run the supplied scenario in groups of 3. Submit the AAR.' },
    { name: 'Quiz 3 — Controls families', type: 'quiz', dueIn: 9, points: 30, weight: 4 },
    { name: 'Risk-management plan draft', type: 'dropbox', dueIn: 21, points: 150, weight: 18 },
  ],
  '1003': [
    { name: 'Sprint 1 commit log', type: 'dropbox', dueIn: -28, points: 40, earned: 36 },
    { name: 'Sprint 2 commit log', type: 'dropbox', dueIn: -14, points: 40, earned: 32 },
    { name: 'Sprint 3 commit log', type: 'dropbox', dueIn: 0, points: 40,
      instructions: 'Tag your sprint-3 commit and link the release notes.' },
    { name: 'Architecture review', type: 'dropbox', dueIn: 7, points: 80,
      instructions: 'Submit a 3-page review with one diagram.' },
    { name: 'Final defense', type: 'dropbox', dueIn: 28, points: 200 },
  ],
  '1004': [
    { name: 'HW 1 — Static site', type: 'dropbox', dueIn: -45, points: 50, earned: 50 },
    { name: 'HW 2 — Forms & validation', type: 'dropbox', dueIn: -30, points: 50, earned: 47 },
    { name: 'HW 3 — Fetch + render', type: 'dropbox', dueIn: -15, points: 50, earned: 48 },
    { name: 'Quiz 1', type: 'quiz', dueIn: -8, points: 20, earned: 19 },
    { name: 'HW 4 — Component library', type: 'dropbox', dueIn: 6, points: 60,
      instructions: 'Build 4 accessible components and ship a Storybook.' },
    { name: 'Final project — portfolio', type: 'dropbox', dueIn: 21, points: 150 },
  ],
  '1005': [
    { name: 'Quiz 1', type: 'quiz', dueIn: -50, points: 30, earned: 23 },
    { name: 'PS1 — vectors & lines', type: 'dropbox', dueIn: -42, points: 40, earned: 32 },
    { name: 'PS2 — partial derivatives', type: 'dropbox', dueIn: -28, points: 40, earned: 30 },
    { name: 'Midterm 1', type: 'quiz', dueIn: -21, points: 100, earned: 71 },
    { name: 'PS3 — multiple integrals', type: 'dropbox', dueIn: -14, points: 40, earned: 31 },
    { name: 'PS4 — vector fields', type: 'dropbox', dueIn: 1, points: 40,
      instructions: 'Sections 16.1 and 16.2. Submit hand-written or LaTeX.' },
    { name: 'Midterm 2', type: 'quiz', dueIn: 11, points: 100 },
    { name: 'Final exam', type: 'quiz', dueIn: 35, points: 150 },
  ],
  '1006': [
    { name: 'Genre analysis', type: 'dropbox', dueIn: -32, points: 30, earned: 27 },
    { name: 'Article summary', type: 'dropbox', dueIn: -18, points: 40, earned: 36 },
    { name: 'Mid-term presentation', type: 'dropbox', dueIn: -4, points: 60, earned: 52 },
    { name: 'Peer review draft', type: 'dropbox', dueIn: 8, points: 30 },
    { name: 'Final research paper', type: 'dropbox', dueIn: 22, points: 150 },
    { name: 'Final presentation', type: 'dropbox', dueIn: 30, points: 80 },
  ],
};

const ANNOUNCEMENTS_BY_COURSE: Record<string, Array<{ title: string; body: string; daysAgo: number }>> = {
  '1001': [
    { title: 'Final project: rubric posted',
      body: 'The Beacon final-project rubric is now in the syllabus packet. Office hours: Tue/Thu 2–3pm in KNOY 241. Email tianyili@purdue.edu for a direct slot.',
      daysAgo: 3 },
    { title: 'Lab 4 solutions released',
      body: 'Solutions and grading notes for normalization lab are posted. Median score: 47/50.', daysAgo: 8 },
    { title: 'Midterm regrades close Friday',
      body: 'Submit regrade requests by Friday 5pm. Use the regrade form linked in the gradebook.', daysAgo: 12 },
  ],
  '1002': [
    { title: 'Tabletop exercise teams posted',
      body: 'Group rosters are in the announcement attachment. Each group submits one AAR.', daysAgo: 1 },
    { title: 'NIST CSF v2 update reading',
      body: 'Optional supplemental reading on NIST CSF v2 — useful for the risk-management plan.', daysAgo: 6 },
  ],
  '1003': [
    { title: 'Final defense slots',
      body: 'Sign-up sheet for the 15-minute final defense slots is open. First-come, first-served.', daysAgo: 2 },
    { title: 'Architecture review template',
      body: 'Use the diagram template in the resources tab. Mermaid or draw.io both fine.', daysAgo: 9 },
  ],
  '1004': [
    { title: 'Storybook deployment notes',
      body: 'Tip: the Vercel free tier works fine for HW4. Tag your README with the live URL.', daysAgo: 4 },
  ],
  '1005': [
    { title: 'Office hours moved this week',
      body: 'Prof. Patel office hours moved to Wed 1–2pm in MATH 410. Email lpatel@purdue.edu otherwise.', daysAgo: 2 },
    { title: 'Midterm 2 review session',
      body: 'TA-led review session Sunday 6pm in REC 217. Bring questions on PS3 and PS4.', daysAgo: 7 },
  ],
  '1006': [
    { title: 'Peer review pairings',
      body: 'Pairings are in the announcement. Drafts due Thursday at midnight.', daysAgo: 1 },
  ],
};

const CONTENT_BY_COURSE: Record<string, Array<{ module: string; topics: string[] }>> = {
  '1001': [
    { module: 'Module 1 — Foundations',
      topics: ['Course syllabus.pdf', 'Relational model lecture', 'ER diagram primer'] },
    { module: 'Module 2 — SQL',
      topics: ['SELECT and JOINs', 'Aggregations', 'Subqueries & CTEs'] },
    { module: 'Module 3 — Schema design',
      topics: ['Normal forms walkthrough', 'Denormalization tradeoffs'] },
    { module: 'Module 4 — Performance',
      topics: ['Indexes', 'Query plans', 'Locking & transactions'] },
  ],
  '1002': [
    { module: 'Unit 1 — Frameworks',
      topics: ['NIST CSF overview', 'ISO 27001 vs NIST'] },
    { module: 'Unit 2 — Risk methods',
      topics: ['Threat modeling', 'Risk register example'] },
  ],
  '1003': [
    { module: 'Capstone resources',
      topics: ['Sprint guide', 'Architecture template', 'Final defense rubric'] },
  ],
  '1004': [
    { module: 'Front-end basics',
      topics: ['HTML semantics', 'CSS flex/grid', 'JavaScript fundamentals'] },
    { module: 'React',
      topics: ['Components', 'State management', 'Forms'] },
  ],
  '1005': [
    { module: 'Vectors and curves',
      topics: ['16.1 vector functions', '16.2 derivatives'] },
    { module: 'Multiple integrals',
      topics: ['Double integrals', 'Triple integrals', 'Change of variables'] },
  ],
  '1006': [
    { module: 'Writing fundamentals',
      topics: ['Genre conventions', 'Citation style'] },
  ],
};

async function seed() {
  ensureReady();

  // 1) Demo user (idempotent)
  const existing = db.select().from(users).where(eq(users.email, DEMO_EMAIL)).get();
  if (existing) {
    console.log(`✓ demo user already exists (id=${existing.id}); skipping reseed.`);
    console.log(`  to reset: rm data/beacon.sqlite && npm run db:seed`);
    return;
  }

  const userId = randomUUID();
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  db.insert(users)
    .values({
      id: userId,
      email: DEMO_EMAIL,
      password_hash: passwordHash,
      sync_status: 'completed',
      last_synced_at: new Date(NOW.getTime() - DAY),
    })
    .run();
  console.log(`✓ created demo user ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);

  // 2) Courses
  const courseIdByOrg = new Map<number, string>();
  for (const c of COURSES_DATA) {
    const id = randomUUID();
    courseIdByOrg.set(c.org, id);
    db.insert(courses)
      .values({
        id,
        user_id: userId,
        brightspace_org_unit_id: c.org,
        name: c.name,
        code: c.code,
        start_date: semesterStart,
        end_date: semesterEnd,
        is_active: true,
        current_grade: c.grade,
      })
      .run();
  }
  console.log(`✓ inserted ${COURSES_DATA.length} courses`);

  // 3) Assignments
  let assignmentCount = 0;
  let bsId = 5000;
  for (const [org, items] of Object.entries(ASSIGNMENTS_BY_COURSE)) {
    const courseId = courseIdByOrg.get(parseInt(org, 10))!;
    for (const a of items) {
      bsId += 1;
      db.insert(assignments)
        .values({
          id: randomUUID(),
          user_id: userId,
          course_id: courseId,
          brightspace_id: bsId,
          type: a.type,
          name: a.name,
          instructions: a.instructions ?? null,
          due_date: daysFromNow(a.dueIn),
          end_date: daysFromNow(a.dueIn + 1),
          points_numerator: a.earned ?? null,
          points_denominator: a.points,
          weight: a.weight ?? null,
          is_completed: a.dueIn < 0 && a.earned != null,
        })
        .run();
      assignmentCount += 1;
    }
  }
  console.log(`✓ inserted ${assignmentCount} assignments`);

  // 4) Announcements
  let annCount = 0;
  let annId = 6000;
  for (const [org, items] of Object.entries(ANNOUNCEMENTS_BY_COURSE)) {
    const courseId = courseIdByOrg.get(parseInt(org, 10))!;
    for (const a of items) {
      annId += 1;
      db.insert(announcements)
        .values({
          id: randomUUID(),
          user_id: userId,
          course_id: courseId,
          brightspace_id: annId,
          title: a.title,
          body: a.body,
          created_date: new Date(NOW.getTime() - a.daysAgo * DAY),
          is_global: false,
        })
        .run();
      annCount += 1;
    }
  }
  console.log(`✓ inserted ${annCount} announcements`);

  // 5) Content modules + topics
  let modCount = 0;
  let topicCount = 0;
  let modBsId = 7000;
  let topicBsId = 8000;
  for (const [org, mods] of Object.entries(CONTENT_BY_COURSE)) {
    const courseId = courseIdByOrg.get(parseInt(org, 10))!;
    for (let mi = 0; mi < mods.length; mi += 1) {
      const m = mods[mi];
      modBsId += 1;
      const moduleId = randomUUID();
      db.insert(content_modules)
        .values({
          id: moduleId,
          user_id: userId,
          course_id: courseId,
          brightspace_module_id: modBsId,
          parent_module_id: null,
          title: m.module,
          sort_order: mi,
        })
        .run();
      modCount += 1;
      for (let ti = 0; ti < m.topics.length; ti += 1) {
        topicBsId += 1;
        db.insert(content_topics)
          .values({
            id: randomUUID(),
            user_id: userId,
            course_id: courseId,
            module_id: moduleId,
            brightspace_topic_id: topicBsId,
            title: m.topics[ti],
            url: null,
            type_identifier: m.topics[ti].toLowerCase().endsWith('.pdf') ? '0' : '1',
            sort_order: ti,
          })
          .run();
        topicCount += 1;
      }
    }
  }
  console.log(`✓ inserted ${modCount} modules / ${topicCount} topics`);

  console.log(`\nDone. Sign in at http://localhost:3000 with:`);
  console.log(`  email:    ${DEMO_EMAIL}`);
  console.log(`  password: ${DEMO_PASSWORD}`);
}

seed().catch((err) => {
  console.error('seed failed:', err);
  process.exit(1);
});
