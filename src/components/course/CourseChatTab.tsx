'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { apiFetch } from '@/lib/api';

interface CourseChatTabProps {
  courseId: string;
  courseName: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function CourseChatTab({ courseId, courseName }: CourseChatTabProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput('');
    setLoading(true);

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: question };
    const assistantId = crypto.randomUUID();
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '' };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    try {
      const res = await apiFetch('/api/ask/course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, question }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');

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
                prev.map((m) => m.id === assistantId ? { ...m, content: m.content + parsed.content } : m)
              );
            }
          } catch {
            // skip unparseable chunks
          }
        }
      }
    } catch (err) {
      console.error('Course chat failed:', err);
      setMessages((prev) =>
        prev.map((m) => m.id === assistantId ? { ...m, content: 'Sorry, something went wrong.' } : m)
      );
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  const shortName = courseName.match(/(?:Spring|Fall|Summer)\s+\d{4}\s+(.+?)(?:\s*[-–]\s*(?:Merge|LEC|LAB|DIS|REC|SD)|$)/i)?.[1]?.replace(/[-–]\d+$/, '').trim() || courseName;

  return (
    <div className="rounded-2xl border border-border bg-background flex flex-col" style={{ height: '500px' }}>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-xs font-mono text-muted-foreground mb-2">[course ai]</p>
              <p className="text-sm text-muted-foreground">
                Ask anything about {shortName}
              </p>
            </div>
          </div>
        )}
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user' ? 'bg-foreground text-background' : 'bg-muted border border-border/50'
              }`}>
                {msg.role === 'assistant' ? (
                  msg.content ? (
                    <div className="prose prose-sm max-w-none text-foreground leading-relaxed">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                      {streaming && messages[messages.length - 1]?.id === msg.id && (
                        <motion.span
                          animate={{ opacity: [1, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                          className="inline-block w-0.5 h-4 bg-foreground ml-0.5 align-text-bottom"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-3.5 h-3.5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full"
                      />
                      Thinking...
                    </div>
                  )
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-border/40">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about ${shortName}...`}
            className="flex-1 px-4 py-2.5 text-sm bg-background border border-border rounded-full outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
          />
          <motion.button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 rounded-full bg-foreground text-background hover:opacity-90 disabled:opacity-30 transition-opacity"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </motion.button>
        </div>
      </form>
    </div>
  );
}
