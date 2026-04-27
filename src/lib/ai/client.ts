// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

// Local-app AI client. Talks to Ollama via its OpenAI-compatible
// /v1/chat/completions endpoint at http://localhost:11434.
//
//   brew install ollama
//   ollama serve &        # background daemon
//   ollama pull qwen2.5:7b
//
// Public surface is identical to the previous Anthropic-backed client so
// every caller (briefing, ask, grade-insight, summarize, assignment-analyze)
// keeps working unchanged.
//
// If Ollama is unreachable, the client falls back to a clearly-labelled
// demo mode so the UI continues to render — students can install Ollama
// later and the same surfaces light up.

const OLLAMA_ENDPOINT = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434/v1';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
type GenOpts = { maxTokens?: number; temperature?: number };

// ─── Reachability cache ───
// We probe Ollama once per process. If unreachable we degrade to demo mode
// for this process; the user can restart after `ollama serve` to re-enable.
let ollamaReachable: boolean | null = null;
let ollamaProbePromise: Promise<boolean> | null = null;

async function probeOllama(): Promise<boolean> {
  if (ollamaReachable !== null) return ollamaReachable;
  if (ollamaProbePromise) return ollamaProbePromise;

  ollamaProbePromise = (async () => {
    try {
      // Strip the trailing /v1 to hit the root health route.
      const root = OLLAMA_ENDPOINT.replace(/\/v1\/?$/, '');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(root, { signal: controller.signal });
      clearTimeout(timeout);
      ollamaReachable = res.ok;
    } catch {
      ollamaReachable = false;
    }
    return ollamaReachable!;
  })();

  return ollamaProbePromise;
}

const DEMO_NOTICE =
  '_(Demo response — Ollama is not running. Install: `brew install ollama` then `ollama pull qwen2.5:7b`.)_\n\n';

function demoText(prompt: string, system: string): string {
  // Pick a canned response shape based on the system prompt category.
  if (/briefing|due soon|this week|heads up/i.test(system)) {
    return (
      DEMO_NOTICE +
      'Due soon: nothing critical in the next 48 hours.\n\n' +
      'This week: pace yourself across the assignments showing on the dashboard.\n\n' +
      'Heads up: nothing urgent.'
    );
  }
  if (/grade insight|weak spot/i.test(system)) {
    return (
      DEMO_NOTICE +
      'Demo grade insight: your strongest area is recent quizzes; the largest opportunity is the next dropbox assignment by points weight.'
    );
  }
  if (/summari[sz]e|syllabus/i.test(system)) {
    return (
      DEMO_NOTICE +
      'This is a placeholder summary. Beacon would normally compress the input into 3–5 short bullets here.'
    );
  }
  if (/instructor|professor|extract|json object/i.test(system)) {
    // Extract-info expects pure JSON — return null fields so the UI shows
    // a clean "add manually" state instead of crashing.
    return JSON.stringify({
      name: null,
      email: null,
      phone: null,
      office: null,
      officeHours: null,
      officeHoursType: 'in-person',
      zoomLink: null,
    });
  }
  // Generic NLQ / chat fallback
  return (
    DEMO_NOTICE +
    `I can't answer "${prompt.slice(0, 80)}" without an LLM running locally. ` +
    `Once Ollama is installed Beacon will answer using the data already synced from Brightspace.`
  );
}

// ─── Streaming SSE parser ───
// The OpenAI-compatible /v1/chat/completions endpoint returns lines of
// `data: {json}\n\n` followed by `data: [DONE]\n\n`.
async function* parseSSEStream(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;
        try {
          const json = JSON.parse(data) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const token = json.choices?.[0]?.delta?.content;
          if (token) yield token;
        } catch {
          // Skip malformed chunks rather than crash the whole stream.
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function callOllama(messages: ChatMessage[], opts?: GenOpts, stream = false) {
  const res = await fetch(`${OLLAMA_ENDPOINT}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.maxTokens ?? 2000,
      stream,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Ollama error ${res.status}: ${text.slice(0, 200)}`);
  }
  return res;
}

// ─── Public API ───

export async function generateCompletion(
  systemPrompt: string,
  userMessage: string,
  options?: GenOpts,
): Promise<string> {
  if (!(await probeOllama())) return demoText(userMessage, systemPrompt);

  const res = await callOllama(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    options,
    false,
  );
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return json.choices?.[0]?.message?.content ?? '';
}

export async function generateCompletionWithHistory(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  options?: GenOpts,
): Promise<string> {
  if (!(await probeOllama())) {
    const last = messages[messages.length - 1]?.content ?? '';
    return demoText(last, systemPrompt);
  }

  const res = await callOllama(
    [{ role: 'system', content: systemPrompt }, ...messages],
    options,
    false,
  );
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return json.choices?.[0]?.message?.content ?? '';
}

async function* demoStream(text: string): AsyncGenerator<string> {
  // Yield demo text as small chunks so the UI's streaming UX still animates.
  const words = text.match(/\S+\s*/g) ?? [text];
  for (const w of words) {
    await new Promise((r) => setTimeout(r, 25));
    yield w;
  }
}

export async function* generateCompletionStream(
  systemPrompt: string,
  userMessage: string,
  options?: GenOpts,
): AsyncGenerator<string> {
  if (!(await probeOllama())) {
    yield* demoStream(demoText(userMessage, systemPrompt));
    return;
  }
  const res = await callOllama(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    options,
    true,
  );
  if (!res.body) return;
  yield* parseSSEStream(res.body);
}

export async function* generateCompletionWithHistoryStream(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  options?: GenOpts,
): AsyncGenerator<string> {
  if (!(await probeOllama())) {
    const last = messages[messages.length - 1]?.content ?? '';
    yield* demoStream(demoText(last, systemPrompt));
    return;
  }
  const res = await callOllama(
    [{ role: 'system', content: systemPrompt }, ...messages],
    options,
    true,
  );
  if (!res.body) return;
  yield* parseSSEStream(res.body);
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
