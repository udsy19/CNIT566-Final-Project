// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import { generateCompletion } from './client';
import { BRIEFING_SYSTEM_PROMPT, buildAcademicContext } from './prompts';
import type { ShimClient } from '@/lib/supabase/shim';

export async function generateDailyBriefing(userId: string, supabase: ShimClient): Promise<string> {
  // Gather academic data
  const [coursesRes, assignmentsRes, announcementsRes] = await Promise.all([
    supabase.from('courses').select('name, code, current_grade').eq('user_id', userId).eq('is_active', true),
    supabase.from('assignments').select('name, due_date, points_numerator, points_denominator, is_completed, course:courses(name)').eq('user_id', userId),
    supabase.from('announcements').select('title, body, created_date, course:courses(name)').eq('user_id', userId).order('created_date', { ascending: false }).limit(10),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assignments = (assignmentsRes.data || []).map((a: any) => ({
    name: a.name as string,
    course_name: a.course?.name || 'Unknown',
    due_date: a.due_date as string | null,
    points_numerator: a.points_numerator as number | null,
    points_denominator: a.points_denominator as number | null,
    is_completed: a.is_completed as boolean,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const announcements = (announcementsRes.data || []).map((a: any) => ({
    title: a.title as string,
    course_name: a.course?.name || 'Unknown',
    created_date: a.created_date as string,
    body: a.body as string | null,
  }));

  const context = buildAcademicContext({
    courses: coursesRes.data || [],
    assignments,
    announcements,
  });

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const userMessage = `Today is ${today}.\n\n${context}\n\nGenerate my daily briefing.`;

  return generateCompletion(BRIEFING_SYSTEM_PROMPT, userMessage, { maxTokens: 500 });
}
