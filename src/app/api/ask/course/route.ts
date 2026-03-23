import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromToken } from '@/lib/supabase/auth-helper';
import { generateCompletionWithHistoryStream, streamToSSEResponse } from '@/lib/ai/client';
import { COURSE_NLQ_SYSTEM_PROMPT, buildCourseContext } from '@/lib/ai/prompts';

export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { courseId, question } = await request.json();
  if (!courseId || !question) {
    return NextResponse.json({ error: 'courseId and question are required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Fetch course data
  const [courseRes, assignmentsRes, announcementsRes, modulesRes, topicsRes] = await Promise.all([
    supabase.from('courses').select('name, code, current_grade').eq('id', courseId).eq('user_id', user.id).single(),
    supabase.from('assignments').select('name, due_date, points_numerator, points_denominator, is_completed, instructions, weight, type').eq('course_id', courseId).eq('user_id', user.id),
    supabase.from('announcements').select('title, created_date, body').eq('course_id', courseId).eq('user_id', user.id).order('created_date', { ascending: false }).limit(10),
    supabase.from('content_modules').select('id, title').eq('course_id', courseId).eq('user_id', user.id).order('sort_order'),
    supabase.from('content_topics').select('title, module_id').eq('course_id', courseId).eq('user_id', user.id),
  ]);

  if (!courseRes.data) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modules = (modulesRes.data || []).map((m: any) => ({
    title: m.title,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    topics: (topicsRes.data || []).filter((t: any) => t.module_id === m.id).map((t: any) => ({ title: t.title })),
  }));

  const context = buildCourseContext({
    course: courseRes.data,
    assignments: assignmentsRes.data || [],
    announcements: announcementsRes.data || [],
    modules,
  });

  const systemPrompt = `${COURSE_NLQ_SYSTEM_PROMPT}\n\n${context}`;

  // Get recent course chat history
  const { data: recentMessages } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(6);

  const history = (recentMessages || [])
    .reverse()
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
  history.push({ role: 'user', content: question });

  async function* streamAndSave() {
    let fullResponse = '';
    const gen = generateCompletionWithHistoryStream(systemPrompt, history, { maxTokens: 4000 });
    for await (const token of gen) {
      fullResponse += token;
      yield token;
    }
    await supabase.from('chat_messages').insert([
      { user_id: user!.id, role: 'user', content: question },
      { user_id: user!.id, role: 'assistant', content: fullResponse },
    ]);
  }

  return streamToSSEResponse(streamAndSave());
}
