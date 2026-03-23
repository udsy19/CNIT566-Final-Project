import OpenAI from 'openai';

function getClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || 'https://genai.rcac.purdue.edu/api',
  });
}

function getModel() {
  return process.env.OPENAI_MODEL || 'gpt-oss:120b';
}

function extractContent(message: OpenAI.Chat.Completions.ChatCompletionMessage): string {
  if (message.content) return message.content;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const msg = message as any;
  if (msg.reasoning_content) return msg.reasoning_content;
  return '';
}

export async function generateCompletion(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: getModel(),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    max_tokens: options?.maxTokens || 2000,
    temperature: options?.temperature || 0.7,
  });

  return extractContent(response.choices[0]?.message);
}

export async function generateCompletionWithHistory(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: getModel(),
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    max_tokens: options?.maxTokens || 2000,
    temperature: options?.temperature || 0.7,
  });

  return extractContent(response.choices[0]?.message);
}

export async function* generateCompletionStream(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; temperature?: number }
): AsyncGenerator<string> {
  const stream = await getClient().chat.completions.create({
    model: getModel(),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    max_tokens: options?.maxTokens || 2000,
    temperature: options?.temperature || 0.7,
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;
    if (!delta) continue;
    // Only yield content tokens, skip reasoning_content
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content = (delta as any).content;
    if (content) yield content;
  }
}

export async function* generateCompletionWithHistoryStream(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  options?: { maxTokens?: number; temperature?: number }
): AsyncGenerator<string> {
  const stream = await getClient().chat.completions.create({
    model: getModel(),
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    max_tokens: options?.maxTokens || 2000,
    temperature: options?.temperature || 0.7,
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;
    if (!delta) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content = (delta as any).content;
    if (content) yield content;
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
