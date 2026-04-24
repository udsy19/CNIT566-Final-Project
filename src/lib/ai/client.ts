// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import Anthropic from '@anthropic-ai/sdk';

function getClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

function getModel() {
  return process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';
}

export async function generateCompletion(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const response = await getClient().messages.create({
    model: getModel(),
    max_tokens: options?.maxTokens || 2000,
    temperature: options?.temperature ?? 0.7,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const block = response.content[0];
  return block?.type === 'text' ? block.text : '';
}

export async function generateCompletionWithHistory(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const response = await getClient().messages.create({
    model: getModel(),
    max_tokens: options?.maxTokens || 2000,
    temperature: options?.temperature ?? 0.7,
    system: systemPrompt,
    messages,
  });

  const block = response.content[0];
  return block?.type === 'text' ? block.text : '';
}

export async function* generateCompletionStream(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; temperature?: number }
): AsyncGenerator<string> {
  const stream = await getClient().messages.stream({
    model: getModel(),
    max_tokens: options?.maxTokens || 2000,
    temperature: options?.temperature ?? 0.7,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
}

export async function* generateCompletionWithHistoryStream(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  options?: { maxTokens?: number; temperature?: number }
): AsyncGenerator<string> {
  const stream = await getClient().messages.stream({
    model: getModel(),
    max_tokens: options?.maxTokens || 2000,
    temperature: options?.temperature ?? 0.7,
    system: systemPrompt,
    messages,
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
}

export function streamToSSEResponse(generator: AsyncGenerator<string>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const token of generator) {
          const data = JSON.stringify({ content: token });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Stream error';
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
