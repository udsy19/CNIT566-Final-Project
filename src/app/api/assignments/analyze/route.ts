// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromToken } from '@/lib/supabase/auth-helper';
import { generateCompletionStream, streamToSSEResponse } from '@/lib/ai/client';
import { ASSIGNMENT_ANALYSIS_SYSTEM_PROMPT } from '@/lib/ai/prompts';

export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { assignmentId } = await request.json();
  if (!assignmentId) {
    return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: assignment } = await supabase
    .from('assignments')
    .select('*, course:courses(name)')
    .eq('id', assignmentId)
    .eq('user_id', user.id)
    .single();

  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  let prompt = `Assignment: ${assignment.name}\n`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prompt += `Course: ${(assignment.course as any)?.name || 'Unknown'}\n`;
  if (assignment.due_date) prompt += `Due: ${assignment.due_date}\n`;
  if (assignment.points_denominator) prompt += `Points: ${assignment.points_denominator}\n`;
  if (assignment.instructions) prompt += `\nInstructions:\n${assignment.instructions}\n`;
  else prompt += '\nNo detailed instructions available. Provide a general analysis based on the assignment name and context.\n';

  const gen = generateCompletionStream(ASSIGNMENT_ANALYSIS_SYSTEM_PROMPT, prompt, { maxTokens: 1000 });
  return streamToSSEResponse(gen);
}
