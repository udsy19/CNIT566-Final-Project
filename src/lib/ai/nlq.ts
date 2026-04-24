// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import { generateCompletionWithHistory } from './client';
import { NLQ_SYSTEM_PROMPT, buildAcademicContext } from './prompts';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function handleNaturalLanguageQuery(
  userId: string,
  question: string,
  supabase: SupabaseClient
): Promise<string> {
  // Gather full academic context
  const [coursesRes, assignmentsRes, announcementsRes] = await Promise.all([
    supabase.from('courses').select('name, code, current_grade').eq('user_id', userId).eq('is_active', true),
    supabase.from('assignments').select('name, due_date, points_numerator, points_denominator, is_completed, course:courses(name)').eq('user_id', userId),
    supabase.from('announcements').select('title, body, created_date, course:courses(name)').eq('user_id', userId).order('created_date', { ascending: false }).limit(20),
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

  // Get recent GLOBAL chat history for context (exclude course-scoped messages)
  const { data: recentMessages } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('user_id', userId)
    .is('course_id', null)
    .order('created_at', { ascending: false })
    .limit(10);

  const history = (recentMessages || [])
    .reverse()
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  // Add current question
  history.push({ role: 'user', content: question });

  const systemPrompt = `${NLQ_SYSTEM_PROMPT}\n\n${context}`;

  return generateCompletionWithHistory(systemPrompt, history, { maxTokens: 1000 });
}
