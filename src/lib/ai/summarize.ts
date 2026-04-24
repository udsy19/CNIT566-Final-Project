// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import { generateCompletion } from './client';
import { SUMMARIZE_SYSTEM_PROMPT } from './prompts';

export async function summarizeContent(text: string): Promise<string> {
  return generateCompletion(SUMMARIZE_SYSTEM_PROMPT, `Summarize the following content:\n\n${text}`);
}

export async function summarizeSyllabus(syllabusText: string): Promise<string> {
  const prompt = `Summarize this course syllabus, highlighting:
- Key topics and learning objectives
- Grading breakdown
- Important policies
- Major assignment types and deadlines

Syllabus:\n\n${syllabusText}`;

  return generateCompletion(SUMMARIZE_SYSTEM_PROMPT, prompt, { maxTokens: 1500 });
}
