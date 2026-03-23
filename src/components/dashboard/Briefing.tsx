'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import type { Briefing as BriefingType } from '@/types';

interface BriefingProps {
  briefing: BriefingType | null;
}

export default function Briefing({ briefing: initialBriefing }: BriefingProps) {
  const [briefing, setBriefing] = useState<BriefingType | null>(initialBriefing);
  const [streamContent, setStreamContent] = useState('');
  const [loading, setLoading] = useState(!initialBriefing);
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    if (!initialBriefing) {
      fetchBriefing();
    }
  }, [initialBriefing]);

  const fetchBriefing = async () => {
    try {
      const res = await apiFetch('/api/briefing?stream=true');

      if (res.headers.get('content-type')?.includes('text/event-stream')) {
        // Streaming response
        setLoading(false);
        setStreaming(true);

        const reader = res.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';

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
                fullContent += parsed.content;
                setStreamContent(fullContent);
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }

        setStreaming(false);
        // Set as briefing object
        setBriefing({
          id: '',
          user_id: '',
          briefing_date: new Date().toISOString().split('T')[0],
          content: fullContent,
          generated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });
      } else {
        // JSON response (cached)
        const { data } = await res.json();
        setBriefing(data);
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to fetch briefing:', err);
      setLoading(false);
    }
  };

  const displayContent = streaming ? streamContent : briefing?.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl border border-border bg-background"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl bg-foreground/5 flex items-center justify-center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-medium">Daily briefing</h3>
          <p className="text-xs text-muted-foreground font-mono">ai-generated</p>
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded-full w-3/4 animate-pulse" />
          <div className="h-3 bg-muted rounded-full w-1/2 animate-pulse" />
          <div className="h-3 bg-muted rounded-full w-5/6 animate-pulse" />
        </div>
      ) : displayContent ? (
        <div className="prose prose-sm max-w-none text-muted-foreground [&_strong]:text-foreground leading-relaxed">
          <ReactMarkdown>{displayContent}</ReactMarkdown>
          {streaming && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="inline-block w-0.5 h-4 bg-muted-foreground ml-0.5 align-text-bottom"
            />
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No briefing available yet. Sync your courses to generate one.
        </p>
      )}
    </motion.div>
  );
}
