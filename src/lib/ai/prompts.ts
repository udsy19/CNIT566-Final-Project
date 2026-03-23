export const BRIEFING_SYSTEM_PROMPT = `You are Beacon, an AI academic assistant for a college student at Purdue University. Generate a concise daily briefing (under 150 words) based on their academic data.

Focus on:
- Assignments due in the next 48 hours (urgent deadlines)
- Recent grade updates or grade trends
- Important announcements from today
- Quick motivational note if appropriate

Format: Use short paragraphs. Bold important deadlines. Be conversational but informative.
Do NOT make up information not present in the data.`;

export const NLQ_SYSTEM_PROMPT = `You are Beacon, an AI academic assistant for a Purdue University student. Answer questions about their academic data accurately and helpfully.

You have access to the student's:
- Course enrollments with grades
- Assignment details with due dates and scores
- Course announcements
- Content modules

Rules:
- Only answer based on the provided data. Never fabricate information.
- If you don't have enough data to answer, say so clearly.
- Be concise and direct.
- Use specific numbers and dates when available.
- If asked about something outside academics, politely redirect.`;

export const SUMMARIZE_SYSTEM_PROMPT = `You are Beacon, an AI academic assistant. Summarize the provided academic content concisely and clearly.

Rules:
- Keep summaries under 200 words unless asked otherwise
- Highlight key concepts, definitions, and important points
- Use bullet points for clarity when appropriate
- Maintain academic accuracy`;

export function buildAcademicContext(data: {
  courses: { name: string; code: string | null; current_grade: number | null }[];
  assignments: { name: string; course_name: string; due_date: string | null; points_numerator: number | null; points_denominator: number | null; is_completed: boolean }[];
  announcements: { title: string; course_name: string; created_date: string; body: string | null }[];
}): string {
  let context = '## Student Academic Data\n\n';

  context += '### Courses\n';
  for (const course of data.courses) {
    context += `- ${course.name}${course.code ? ` (${course.code})` : ''}`;
    if (course.current_grade != null) context += ` — Grade: ${course.current_grade.toFixed(1)}%`;
    context += '\n';
  }

  context += '\n### Upcoming Assignments\n';
  const upcoming = data.assignments
    .filter((a) => a.due_date && !a.is_completed && new Date(a.due_date) > new Date())
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

  if (upcoming.length === 0) {
    context += 'No upcoming assignments.\n';
  } else {
    for (const a of upcoming.slice(0, 15)) {
      context += `- [${a.course_name}] "${a.name}" — Due: ${a.due_date}`;
      if (a.points_denominator) context += ` (${a.points_denominator} pts)`;
      context += '\n';
    }
  }

  context += '\n### Recent Announcements\n';
  const recent = data.announcements
    .sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())
    .slice(0, 5);

  if (recent.length === 0) {
    context += 'No recent announcements.\n';
  } else {
    for (const a of recent) {
      context += `- [${a.course_name}] "${a.title}" (${a.created_date})\n`;
    }
  }

  return context;
}

export const COURSE_NLQ_SYSTEM_PROMPT = `You are Beacon, an AI academic assistant for a Purdue University student. You are chatting about a specific course. You have full access to the course data below including assignments, grades, content modules, and announcements.

Your capabilities:
- Grade analysis: Calculate what scores are needed on remaining assignments to achieve target grades (A, B, C). Show specific scenarios.
- Assignment planning: Identify upcoming deadlines, prioritize by weight/points, suggest study schedules.
- Content navigation: Help find specific topics, modules, or materials.
- Course insights: Analyze grade trends, identify weak areas, suggest focus topics.

When asked about grades or "how to get an A":
1. Look at the current grade and assignment scores.
2. Identify remaining/upcoming assignments with their point values.
3. Calculate specific score combinations needed for each target grade (A = 93%+, A- = 90%+, B+ = 87%+, B = 83%+, etc.).
4. Present as a clear table or bullet list with specific numbers.
5. If weight data is available, factor it in. If not, assume equal weight.

Rules:
- Be direct and specific. Use actual numbers from the data.
- Never fabricate grades or assignments not in the data.
- If data is missing (e.g., no scores yet), say so and provide estimates based on what IS available.
- Format responses with markdown for readability.
- Keep responses focused and actionable.`;

export const ASSIGNMENT_ANALYSIS_SYSTEM_PROMPT = `You are Beacon, an AI academic assistant. Analyze the given assignment and provide:

1. **Summary** — What the assignment requires in 2-3 sentences
2. **Key deliverables** — Bullet list of what needs to be submitted
3. **Approach tips** — How to tackle this assignment effectively
4. **Time estimate** — Rough estimate based on complexity

Be concise and practical. Use the assignment instructions and context provided.`;

export function buildCourseContext(data: {
  course: { name: string; code: string | null; current_grade: number | null };
  assignments: { name: string; due_date: string | null; points_numerator: number | null; points_denominator: number | null; is_completed: boolean; instructions: string | null; weight: number | null; type: string }[];
  announcements: { title: string; created_date: string; body: string | null }[];
  modules: { title: string; topics: { title: string }[] }[];
}): string {
  const now = new Date();
  let context = `## Course: ${data.course.name}\n`;
  if (data.course.code) context += `Code: ${data.course.code}\n`;
  if (data.course.current_grade != null) context += `Current Overall Grade: ${data.course.current_grade.toFixed(1)}%\n`;
  context += `Today: ${now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}\n`;

  // Separate graded vs ungraded vs upcoming
  const graded = data.assignments.filter(a => a.points_numerator != null && a.points_denominator != null && a.points_denominator > 0);
  const upcoming = data.assignments.filter(a => a.due_date && new Date(a.due_date) > now && !a.is_completed);
  const past = data.assignments.filter(a => a.due_date && new Date(a.due_date) <= now);

  if (graded.length > 0) {
    context += '\n### Graded Assignments (scores received)\n';
    let totalEarned = 0, totalPossible = 0;
    for (const a of graded) {
      const pct = ((a.points_numerator! / a.points_denominator!) * 100).toFixed(1);
      context += `- "${a.name}": ${a.points_numerator}/${a.points_denominator} (${pct}%)`;
      if (a.weight) context += ` [weight: ${a.weight}%]`;
      context += ` [${a.type}]\n`;
      totalEarned += a.points_numerator!;
      totalPossible += a.points_denominator!;
    }
    context += `\nGraded total: ${totalEarned}/${totalPossible} = ${((totalEarned/totalPossible)*100).toFixed(1)}%\n`;
  }

  if (upcoming.length > 0) {
    context += '\n### Upcoming Assignments (not yet due)\n';
    const sorted = [...upcoming].sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());
    for (const a of sorted) {
      context += `- "${a.name}" — Due: ${new Date(a.due_date!).toLocaleDateString()}`;
      if (a.points_denominator) context += ` (${a.points_denominator} pts)`;
      if (a.weight) context += ` [weight: ${a.weight}%]`;
      context += ` [${a.type}]\n`;
    }
  }

  const ungradedPast = past.filter(a => a.points_numerator == null);
  if (ungradedPast.length > 0) {
    context += `\n### Submitted but not yet graded: ${ungradedPast.length} assignments\n`;
    for (const a of ungradedPast.slice(0, 10)) {
      context += `- "${a.name}"`;
      if (a.points_denominator) context += ` (${a.points_denominator} pts possible)`;
      context += '\n';
    }
  }

  context += `\n### All Assignments Summary\n`;
  context += `Total: ${data.assignments.length} | Graded: ${graded.length} | Upcoming: ${upcoming.length} | Ungraded past: ${ungradedPast.length}\n`;

  if (data.announcements.length > 0) {
    context += '\n### Recent Announcements\n';
    for (const a of data.announcements.slice(0, 5)) {
      context += `- "${a.title}" (${a.created_date})\n`;
    }
  }

  if (data.modules.length > 0) {
    context += '\n### Content Modules\n';
    for (const m of data.modules) {
      context += `- ${m.title}`;
      if (m.topics.length > 0) context += `: ${m.topics.map(t => t.title).join(', ')}`;
      context += '\n';
    }
  }

  return context;
}
