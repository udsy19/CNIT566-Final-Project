import { NextResponse, type NextRequest } from 'next/server';
import { getUserFromToken } from '@/lib/supabase/auth-helper';
import { summarizeContent } from '@/lib/ai/summarize';

export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { text } = await request.json();

  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 });
  }

  try {
    const summary = await summarizeContent(text);
    return NextResponse.json({ data: { summary } });
  } catch (err) {
    console.error('Summarize failed:', err);
    return NextResponse.json({ error: 'Failed to summarize' }, { status: 500 });
  }
}
