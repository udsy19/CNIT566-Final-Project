import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromToken } from '@/lib/supabase/auth-helper';
import { handleNaturalLanguageQuery } from '@/lib/ai/nlq';
import { generateCompletionWithHistoryStream, streamToSSEResponse } from '@/lib/ai/client';
import { NLQ_SYSTEM_PROMPT, buildAcademicContext } from '@/lib/ai/prompts';

export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const body = await request.json();
  const { question, stream: useStream } = body;

  if (!question || typeof question !== 'string') {
    return NextResponse.json({ error: 'Question is required' }, { status: 400 });
  }

  // Save user message
  await supabase.from('chat_messages').insert({
    user_id: user.id,
    role: 'user',
    content: question,
  });

  if (useStream) {
    // Build context
    const [coursesRes, assignmentsRes, announcementsRes] = await Promise.all([
      supabase.from('courses').select('name, code, current_grade').eq('user_id', user.id).eq('is_active', true),
      supabase.from('assignments').select('name, due_date, points_numerator, points_denominator, is_completed, course:courses(name)').eq('user_id', user.id),
      supabase.from('announcements').select('title, body, created_date, course:courses(name)').eq('user_id', user.id).order('created_date', { ascending: false }).limit(20),
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

    // Get chat history
    const { data: recentMessages } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const history = (recentMessages || [])
      .reverse()
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    history.push({ role: 'user', content: question });

    const systemPrompt = `${NLQ_SYSTEM_PROMPT}\n\n${context}`;

    // Create streaming generator that also saves the response
    async function* streamAndSave() {
      let fullResponse = '';
      const gen = generateCompletionWithHistoryStream(systemPrompt, history, { maxTokens: 2000 });
      for await (const token of gen) {
        fullResponse += token;
        yield token;
      }
      // Save assistant message after stream completes
      await supabase.from('chat_messages').insert({
        user_id: user!.id,
        role: 'assistant',
        content: fullResponse,
      });
    }

    return streamToSSEResponse(streamAndSave());
  }

  // Non-streaming fallback
  try {
    const answer = await handleNaturalLanguageQuery(user.id, question, supabase);
    await supabase.from('chat_messages').insert({
      user_id: user.id,
      role: 'assistant',
      content: answer,
    });
    return NextResponse.json({ data: { answer } });
  } catch (err) {
    console.error('Ask failed:', err);
    return NextResponse.json({ error: 'Failed to process question' }, { status: 500 });
  }
}
