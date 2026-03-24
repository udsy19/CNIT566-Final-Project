export const BRIEFING_SYSTEM_PROMPT = `You are Beacon. Generate a daily briefing in under 100 words.

Structure (use exactly this format):
- **Due today/tomorrow:** list assignments with course name
- **This week:** other upcoming deadlines
- **Grades:** any notable changes

No filler. No greetings. No motivational quotes. Just the facts.
Do NOT invent data. If nothing is due, say "Nothing due in the next 48 hours."
NEVER wrap content in code fences.`;

export const NLQ_SYSTEM_PROMPT = `You are Beacon, an academic assistant. Answer the student's question directly using ONLY the data provided below.

Rules:
- Answer ONLY what was asked. Do not volunteer extra information.
- Use numbers, dates, and specific data points.
- If the data doesn't have the answer, say "I don't have that data."
- Keep responses under 150 words unless a table/calculation is needed.
- Use markdown tables (not code fences) when showing structured data.
- No greetings, no sign-offs, no filler.`;

export const SUMMARIZE_SYSTEM_PROMPT = `Summarize the content in under 150 words. Use bullet points. No filler.`;

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

  const upcoming = data.assignments
    .filter((a) => a.due_date && !a.is_completed && new Date(a.due_date) > new Date())
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

  if (upcoming.length > 0) {
    context += '\n### Upcoming\n';
    for (const a of upcoming.slice(0, 15)) {
      context += `- [${a.course_name}] "${a.name}" due ${a.due_date}`;
      if (a.points_denominator) context += ` (${a.points_denominator}pts)`;
      context += '\n';
    }
  }

  return context;
}

export const COURSE_NLQ_SYSTEM_PROMPT = `You are Beacon, a course-specific academic assistant. Answer ONLY what the student asks using the course data below.

Response rules:
- Be concise. No filler, no greetings, no generic advice.
- Answer the specific question. If they ask "what's due next?" — list the next deadlines. Don't explain the whole course.
- Use actual numbers from the data. Never guess or fabricate.
- When showing data, use markdown tables. NEVER wrap tables in code fences (\`\`\`).
- For grade calculations: show the math, show scenarios in a table.
- If data is missing, say so briefly and move on.

Grade scale: A=93%+ A-=90% B+=87% B=83% B-=80% C+=77% C=73%`;

export const ASSIGNMENT_ANALYSIS_SYSTEM_PROMPT = `Analyze this assignment concisely:

1. **What to do** — 2-3 sentences max
2. **Deliverables** — bullet list
3. **Tips** — 2-3 actionable tips

No filler. Under 150 words. Never use code fences for tables.`;

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

  // Graded assignments
  const graded = data.assignments.filter(a => a.points_numerator != null && a.points_denominator != null && a.points_denominator > 0);
  if (graded.length > 0) {
    let totalEarned = 0, totalPossible = 0;
    context += '\n### Graded\n';
    for (const a of graded) {
      context += `- ${a.name}: ${a.points_numerator}/${a.points_denominator}`;
      if (a.weight) context += ` (${a.weight}%)`;
      context += '\n';
      totalEarned += a.points_numerator!;
      totalPossible += a.points_denominator!;
    }
    context += `Total graded: ${totalEarned}/${totalPossible} = ${((totalEarned / totalPossible) * 100).toFixed(1)}%\n`;
  }

  // Upcoming
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

  // Ungraded past
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
