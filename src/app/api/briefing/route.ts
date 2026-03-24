import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromToken } from '@/lib/supabase/auth-helper';
import { generateDailyBriefing } from '@/lib/ai/briefing';
import { generateCompletionStream, streamToSSEResponse } from '@/lib/ai/client';
import { BRIEFING_SYSTEM_PROMPT, buildAcademicContext } from '@/lib/ai/prompts';
import { checkRateLimit } from '@/lib/rateLimit';

export async function GET(request: Request) {
  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { allowed, resetIn } = checkRateLimit(user.id, 'briefing', 10, 60000);
  if (!allowed) {
    return NextResponse.json(
      { error: `Rate limited. Try again in ${Math.ceil(resetIn / 1000)}s` },
      { status: 429 }
    );
  }

  const supabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];

  // Check cache
  const { data: cached } = await supabase
    .from('briefings')
    .select('*')
    .eq('user_id', user.id)
    .eq('briefing_date', today)
    .maybeSingle();

  if (cached) {
    return NextResponse.json({ data: cached });
  }

  const url = new URL(request.url);
  const useStream = url.searchParams.get('stream') === 'true';

  if (useStream) {
    // Build context
    const [coursesRes, assignmentsRes, announcementsRes] = await Promise.all([
      supabase.from('courses').select('name, code, current_grade').eq('user_id', user.id).eq('is_active', true),
      supabase.from('assignments').select('name, due_date, points_numerator, points_denominator, is_completed, course:courses(name)').eq('user_id', user.id),
      supabase.from('announcements').select('title, body, created_date, course:courses(name)').eq('user_id', user.id).order('created_date', { ascending: false }).limit(10),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assignments = (assignmentsRes.data || []).map((a: any) => ({
      name: a.name, course_name: a.course?.name || 'Unknown',
      due_date: a.due_date, points_numerator: a.points_numerator,
      points_denominator: a.points_denominator, is_completed: a.is_completed,
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const announcements = (announcementsRes.data || []).map((a: any) => ({
      title: a.title, course_name: a.course?.name || 'Unknown',
      created_date: a.created_date, body: a.body,
    }));

    const context = buildAcademicContext({ courses: coursesRes.data || [], assignments, announcements });
    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const userMessage = `Today is ${todayStr}.\n\n${context}\n\nGenerate my daily briefing.`;

    async function* streamAndSave() {
      let fullContent = '';
      const gen = generateCompletionStream(BRIEFING_SYSTEM_PROMPT, userMessage, { maxTokens: 500 });
      for await (const token of gen) {
        fullContent += token;
        yield token;
      }
      // Cache the briefing
      await supabase.from('briefings').upsert({
        user_id: user!.id,
        briefing_date: today,
        content: fullContent,
      }, { onConflict: 'user_id,briefing_date' });
    }

    return streamToSSEResponse(streamAndSave());
  }

  // Non-streaming fallback
  try {
    const content = await generateDailyBriefing(user.id, supabase);
    const { data: briefing, error } = await supabase
      .from('briefings')
      .upsert({ user_id: user.id, briefing_date: today, content }, { onConflict: 'user_id,briefing_date' })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ data: briefing });
  } catch (err) {
    console.error('Briefing generation failed:', err);
    return NextResponse.json({ error: 'Failed to generate briefing' }, { status: 500 });
  }
}
