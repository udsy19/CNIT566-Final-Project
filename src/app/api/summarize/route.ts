// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import { NextResponse, type NextRequest } from 'next/server';
import { getUserFromToken } from '@/lib/supabase/auth-helper';
import { generateCompletionStream, streamToSSEResponse } from '@/lib/ai/client';
import { SUMMARIZE_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit
  const { allowed, resetIn } = checkRateLimit(user.id, 'summarize', 10, 60000);
  if (!allowed) {
    return NextResponse.json(
      { error: `Rate limited. Try again in ${Math.ceil(resetIn / 1000)}s` },
      { status: 429 }
    );
  }

  const body = await request.json();
  const text = body.text || body.content;

  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'Text or content is required' }, { status: 400 });
  }

  try {
    const generator = generateCompletionStream(SUMMARIZE_SYSTEM_PROMPT, text, { maxTokens: 500 });
    return streamToSSEResponse(generator);
  } catch (err) {
    console.error('Summarize failed:', err);
    return NextResponse.json({ error: 'Failed to summarize' }, { status: 500 });
  }
}
