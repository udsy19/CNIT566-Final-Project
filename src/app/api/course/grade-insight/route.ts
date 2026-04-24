// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromToken } from '@/lib/supabase/auth-helper';
import { generateCompletionStream, streamToSSEResponse } from '@/lib/ai/client';
import { GRADE_INSIGHT_SYSTEM_PROMPT } from '@/lib/ai/prompts';

export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { courseId } = await request.json();
  if (!courseId) {
    return NextResponse.json({ error: 'courseId required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const [courseRes, assignmentsRes] = await Promise.all([
    supabase.from('courses').select('name, current_grade').eq('id', courseId).eq('user_id', user.id).single(),
    supabase.from('assignments')
      .select('name, type, points_numerator, points_denominator, weight, due_date')
      .eq('course_id', courseId)
      .eq('user_id', user.id)
      .not('points_numerator', 'is', null)
      .not('points_denominator', 'is', null)
      .order('due_date', { ascending: true }),
  ]);

  if (!courseRes.data) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  const graded = (assignmentsRes.data || []).filter((a: { points_denominator: number | null }) => (a.points_denominator ?? 0) > 0);
  if (graded.length === 0) {
    return NextResponse.json({ error: 'No graded assignments yet' }, { status: 404 });
  }

  let prompt = `Course: ${courseRes.data.name}\n`;
  if (courseRes.data.current_grade != null) prompt += `Overall: ${courseRes.data.current_grade.toFixed(1)}%\n`;
  prompt += `\nGraded assignments (chronological):\n`;

  for (const a of graded) {
    const pct = ((a.points_numerator / a.points_denominator) * 100).toFixed(0);
    prompt += `- ${a.name} (${a.type}): ${a.points_numerator}/${a.points_denominator} = ${pct}%`;
    if (a.weight) prompt += ` [${a.weight}% weight]`;
    prompt += '\n';
  }

  const gen = generateCompletionStream(GRADE_INSIGHT_SYSTEM_PROMPT, prompt, { maxTokens: 300 });
  return streamToSSEResponse(gen);
}
