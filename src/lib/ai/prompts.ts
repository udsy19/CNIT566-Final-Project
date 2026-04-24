// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

export const BRIEFING_SYSTEM_PROMPT = `You are Beacon. Generate a short daily briefing for a student.

Output exactly this format with these section headers (## headers):

## due soon
Assignments due in the next 48 hours. One line each: "Assignment — Course (Xh left)". If nothing, say "All clear for the next 48 hours."

## this week
Other deadlines this week. One line each. Omit if none.

## heads up
Anything the student should watch out for — grade drops, upcoming exams mentioned in announcements, patterns in their grades. Be direct: "You scored 60% on the last two CNIT 470 homeworks. Review feedback before the next one." Omit if nothing notable.

Rules:
- Under 80 words total. Every word must earn its place.
- Talk TO the student, not ABOUT them. Say "you" not "the student".
- No greetings, no filler, no motivation, no "good luck"
- Only use provided data. Never invent.
- NEVER use code fences`;

export const NLQ_SYSTEM_PROMPT = `You are Beacon. Answer the student's question using ONLY the data below.

Rules:
- Answer what was asked. Nothing more. No greetings, no sign-offs.
- Use specific numbers and dates from the data.
- Talk TO the student: "you have" not "the student has".
- If data is missing, say so in one sentence.
- Under 150 words unless the answer needs a table.

FORMATTING REQUIREMENTS:
- When showing GRADES across courses or multiple assignments, use a markdown table:

| Course | Grade | Trend |
|--------|-------|-------|
| CNIT 470 | 87% | Up |

- When listing UPCOMING assignments across courses, use a table with Assignment, Course, Due Date, Points columns.
- When doing GRADE CALCULATIONS or scenarios, show a table with current/max/required columns.
- Use **bold** for key numbers.
- NEVER use code fences around tables.`;

export const SUMMARIZE_SYSTEM_PROMPT = `Summarize in under 100 words. Bullet points. No filler.`;

export function buildAcademicContext(data: {
  courses: { name: string; code: string | null; current_grade: number | null }[];
  assignments: { name: string; course_name: string; due_date: string | null; points_numerator: number | null; points_denominator: number | null; is_completed: boolean }[];
  announcements: { title: string; course_name: string; created_date: string; body: string | null }[];
}): string {
  let context = '## Academic Data\n\n';

  context += '### Courses\n';
  for (const course of data.courses) {
    context += `- ${course.name}`;
    if (course.current_grade != null) context += `: ${course.current_grade.toFixed(1)}%`;
    context += '\n';
  }

  const now = new Date();
  const upcoming = data.assignments
    .filter((a) => a.due_date && !a.is_completed && new Date(a.due_date) > now)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

  if (upcoming.length > 0) {
    context += '\n### Upcoming\n';
    for (const a of upcoming.slice(0, 15)) {
      context += `- [${a.course_name}] "${a.name}" due ${a.due_date}`;
      if (a.points_denominator) context += ` (${a.points_denominator}pts)`;
      context += '\n';
    }
  }

  // Include recent graded assignments for trend detection
  const recentGraded = data.assignments
    .filter(a => a.points_numerator != null && a.points_denominator != null && a.points_denominator > 0)
    .slice(0, 20);

  if (recentGraded.length > 0) {
    context += '\n### Recent Grades\n';
    for (const a of recentGraded) {
      const pct = ((a.points_numerator! / a.points_denominator!) * 100).toFixed(0);
      context += `- [${a.course_name}] "${a.name}": ${a.points_numerator}/${a.points_denominator} (${pct}%)\n`;
    }
  }

  // Include recent announcements for exam/deadline mentions
  if (data.announcements.length > 0) {
    context += '\n### Recent Announcements\n';
    for (const a of data.announcements.slice(0, 5)) {
      const body = a.body ? a.body.replace(/<[^>]*>/g, '').slice(0, 200) : '';
      context += `- [${a.course_name}] "${a.title}" (${a.created_date})${body ? ': ' + body : ''}\n`;
    }
  }

  return context;
}

export const COURSE_NLQ_SYSTEM_PROMPT = `You are Beacon, a course-specific academic assistant. Answer ONLY what the student asks using the course data below.

Rules:
- Be concise. No filler, no greetings, no sign-offs.
- Answer the specific question. Don't explain the whole course.
- Use actual numbers from the data. Never guess or fabricate.
- Talk TO the student: "you scored" not "the student scored".
- Under 150 words unless the answer requires calculation or tables.

FORMATTING REQUIREMENTS:
- When the answer involves GRADES, CALCULATIONS, or MULTIPLE ASSIGNMENTS, you MUST use a markdown table. Example:

| Item | Score | % | Weight |
|------|-------|---|--------|
| HW1 | 85/100 | 85% | 10% |
| HW2 | 92/100 | 92% | 10% |

- When listing UPCOMING deadlines: use a table with Assignment, Due Date, Points columns.
- When showing GRADE SCENARIOS (e.g., "what do I need to get an A?"): show a calculation table with current points, max possible, and required scores.
- When showing MULTIPLE DATA POINTS in sequence: prefer a table over bullet points.
- Use **bold** for key numbers and takeaways.
- NEVER wrap tables in code fences (\`\`\`).

Grade scale: A=93%+ A-=90% B+=87% B=83% B-=80% C+=77% C=73% C-=70% D+=67% D=63% D-=60%`;

export const ASSIGNMENT_ANALYSIS_SYSTEM_PROMPT = `Analyze this assignment concisely:

1. **What to do** — 2-3 sentences max
2. **Deliverables** — bullet list
3. **Tips** — 2-3 actionable tips

Under 100 words. No filler. No code fences.`;

export const GRADE_INSIGHT_SYSTEM_PROMPT = `You are Beacon. Analyze the student's grade trends for this course. Be direct and personal.

Rules:
- Point out specific weak spots: "You scored below 70% on the last 2 homeworks"
- Suggest what to review based on the pattern
- If grades are good, say so in one line and move on
- Under 80 words. No filler, no generic advice.
- Talk TO the student: "you" not "the student"
- NEVER use code fences`;

export function buildCourseContext(data: {
  course: { name: string; code: string | null; current_grade: number | null };
  assignments: { name: string; due_date: string | null; points_numerator: number | null; points_denominator: number | null; is_completed: boolean; instructions: string | null; weight: number | null; type: string }[];
  announcements: { title: string; created_date: string; body: string | null }[];
  modules: { title: string; topics: { title: string }[] }[];
}): string {
  const now = new Date();
  let context = `## ${data.course.name}`;
  if (data.course.current_grade != null) context += ` — Current: ${data.course.current_grade.toFixed(1)}%`;
  context += `\nToday: ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}\n`;

  const graded = data.assignments.filter(a => a.points_numerator != null && a.points_denominator != null && a.points_denominator > 0);
  if (graded.length > 0) {
    let totalEarned = 0, totalPossible = 0;
    context += '\n### Graded\n';
    for (const a of graded) {
      const pct = ((a.points_numerator! / a.points_denominator!) * 100).toFixed(0);
      context += `- ${a.name}: ${a.points_numerator}/${a.points_denominator} (${pct}%)`;
      if (a.weight) context += ` [${a.weight}% weight]`;
      context += '\n';
      totalEarned += a.points_numerator!;
      totalPossible += a.points_denominator!;
    }
    context += `Total: ${totalEarned}/${totalPossible} = ${((totalEarned / totalPossible) * 100).toFixed(1)}%\n`;
  }

  const upcoming = data.assignments
    .filter(a => a.due_date && new Date(a.due_date) > now && !a.is_completed)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

  if (upcoming.length > 0) {
    context += '\n### Upcoming\n';
    for (const a of upcoming) {
      context += `- ${a.name} — ${new Date(a.due_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      if (a.points_denominator) context += ` (${a.points_denominator}pts)`;
      context += '\n';
    }
  }

  const ungradedPast = data.assignments.filter(a => a.due_date && new Date(a.due_date) <= now && a.points_numerator == null);
  if (ungradedPast.length > 0) {
    context += `\n### Awaiting grades: ${ungradedPast.length} assignments\n`;
  }

  context += `\nTotals: ${data.assignments.length} assignments | ${graded.length} graded | ${upcoming.length} upcoming\n`;

  if (data.modules.length > 0) {
    context += '\n### Modules\n';
    for (const m of data.modules) {
      context += `- ${m.title} (${m.topics.length} topics)\n`;
    }
  }

  return context;
}
