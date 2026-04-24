// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatMarkdown from '@/components/ui/ChatMarkdown';
import { apiFetch } from '@/lib/api';
import TopBar from '@/components/layout/TopBar';
import type { ChatMessage } from '@/types';

const SUGGESTIONS = [
  'What assignments are due this week?',
  'Give me a grade summary',
  'Help me make a study plan',
  'What quizzes are coming up?',
  'How am I doing overall?',
  'Summarize recent announcements',
];

export default function AskPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadHistory = async () => {
    try {
      const res = await apiFetch('/api/ask/history');
      if (res.ok) {
        const { data } = await res.json();
        if (data) setMessages(data);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const sendQuestion = async (question: string) => {
    if (!question.trim() || loading) return;

    setInput('');
    setLoading(true);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: '',
      course_id: null,
      role: 'user',
      content: question.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const assistantId = crypto.randomUUID();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      user_id: '',
      course_id: null,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setStreaming(true);

    try {
      const res = await apiFetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), stream: true }),
      });

      if (!res.ok) {
        throw new Error('Failed to get response');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream reader');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + parsed.content }
                    : m
                )
              );
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }
    } catch (err) {
      console.error('Ask failed:', err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: 'Sorry, I encountered an error. Please try again.' }
            : m
        )
      );
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sendQuestion(input);
  };

  return (
    <>
      <TopBar title="Ask Beacon" />
      <div className="flex flex-col h-[calc(100dvh-3.5rem-5rem)] md:h-[calc(100dvh-3.5rem)]">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 max-w-3xl mx-auto w-full">
          {messages.length === 0 && !loading && (
            <div className="flex items-center justify-center h-full">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-md px-2"
              >
                <div className="w-14 h-14 rounded-2xl bg-foreground/5 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                </div>
                <p className="text-sm font-mono text-muted-foreground mb-3">[ask beacon]</p>
                <h2 className="text-2xl md:text-3xl font-light tracking-tight mb-6">
                  What do you need to know?
                </h2>

                {/* Prompt suggestion pills */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTIONS.map((s) => (
                    <motion.button
                      key={s}
                      onClick={() => sendQuestion(s)}
                      className="px-3.5 py-2.5 md:px-4 md:py-2 rounded-full border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 active:bg-muted/30 transition-all"
                      whileTap={{ scale: 0.97 }}
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={msg.role === 'user' ? 'flex justify-end' : ''}
              >
                {msg.role === 'user' ? (
                  <div className="max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-2.5 bg-foreground text-background break-words">
                    <p className="text-sm">{msg.content}</p>
                  </div>
                ) : (
                  <div className="w-full overflow-hidden">
                    {msg.content ? (
                      <div>
                        <ChatMarkdown content={msg.content} />
                        {streaming && messages[messages.length - 1]?.id === msg.id && (
                          <motion.span
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="inline-block w-0.5 h-4 bg-foreground ml-0.5 align-text-bottom"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 py-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full"
                        />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border/40 p-3 md:p-4">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex gap-2 md:gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about courses, grades..."
                autoComplete="off"
                autoCorrect="off"
                className="flex-1 px-4 md:px-5 py-3 text-base md:text-sm bg-background border border-border rounded-full outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
              />
              <motion.button
                type="submit"
                disabled={!input.trim() || loading}
                className="px-4 md:px-5 py-3 rounded-full bg-foreground text-background hover:opacity-90 active:opacity-80 disabled:opacity-30 transition-opacity shrink-0"
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </motion.button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
