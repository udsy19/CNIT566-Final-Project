'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatMarkdown from '@/components/ui/ChatMarkdown';
import { apiFetch } from '@/lib/api';
import type { ContentModule, ContentTopic } from '@/types';

interface ContentTabProps {
  modules: ContentModule[];
  topics: ContentTopic[];
}

export default function ContentTab({ modules, topics }: ContentTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [summarizing, setSummarizing] = useState<string | null>(null);

  const handleSummarize = async (moduleId: string, moduleTitle: string, moduleTopics: ContentTopic[]) => {
    if (summaries[moduleId]) return;
    setSummarizing(moduleId);

    try {
      const content = `Module: ${moduleTitle}\n\nTopics:\n${moduleTopics.map(t => `- ${t.title}`).join('\n')}`;

      const res = await apiFetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, moduleId }),
      });

      if (res.headers.get('content-type')?.includes('text/event-stream')) {
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
                setSummaries(prev => ({ ...prev, [moduleId]: fullContent }));
              }
            } catch {}
          }
        }
      } else {
        const { data } = await res.json();
        setSummaries(prev => ({ ...prev, [moduleId]: data?.summary || 'No summary available.' }));
      }
    } catch (err) {
      console.error('Summarize failed:', err);
      setSummaries(prev => ({ ...prev, [moduleId]: 'Failed to generate summary.' }));
    } finally {
      setSummarizing(null);
    }
  };

  return (
    <div className="p-6 rounded-2xl border border-border bg-background">
      <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
        Content Modules ({modules.length})
      </p>
      {modules.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground mb-1">No content modules</p>
          <p className="text-xs text-muted-foreground/60">Course content will appear here after syncing</p>
        </div>
      ) : (
        <div className="space-y-1">
          {modules.map((mod) => {
            const modTopics = topics.filter((t) => t.module_id === mod.id);
            const isExpanded = expandedId === mod.id;
            return (
              <div key={mod.id}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : mod.id)}
                  className="w-full flex items-center justify-between gap-4 px-3 py-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-foreground/5 flex items-center justify-center text-xs text-muted-foreground">
                      {modTopics.length}
                    </div>
                    <p className="text-sm font-medium">{mod.title}</p>
                  </div>
                  <svg
                    className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 ml-9 space-y-2">
                        {modTopics.length > 0 && (
                          <ul className="space-y-1">
                            {modTopics.map((topic) => {
                              const isFile = topic.type_identifier?.includes('File') || topic.title.match(/\.(pdf|pptx?|docx?|xlsx?|zip|png|jpg)$/i);
                              const isLink = topic.type_identifier?.includes('Link') || topic.url?.startsWith('http');

                              const icon = isFile ? (
                                <svg className="w-3.5 h-3.5 shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                              ) : isLink ? (
                                <svg className="w-3.5 h-3.5 shrink-0 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.864-4.243a4.5 4.5 0 00-6.364 0l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                                </svg>
                              ) : (
                                <svg className="w-3.5 h-3.5 shrink-0 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                </svg>
                              );

                              return (
                                <li key={topic.id}>
                                  {topic.url ? (
                                    <a
                                      href={topic.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/[0.03] transition-all"
                                    >
                                      {icon}
                                      <span className="truncate">{topic.title}</span>
                                      <svg className="w-3 h-3 shrink-0 ml-auto opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    </a>
                                  ) : (
                                    <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
                                      {icon}
                                      <span className="truncate">{topic.title}</span>
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}

                        {/* Summarize button */}
                        <motion.button
                          onClick={() => handleSummarize(mod.id, mod.title, modTopics)}
                          disabled={summarizing === mod.id}
                          className="mt-2 px-4 py-2 rounded-full text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all disabled:opacity-50"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {summarizing === mod.id ? 'Summarizing...' : summaries[mod.id] ? 'Re-summarize' : 'Summarize with AI'}
                        </motion.button>

                        {summaries[mod.id] && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-3 rounded-xl border border-border/50 bg-background mt-2"
                          >
                            <p className="text-xs font-mono text-muted-foreground mb-1.5">ai summary</p>
                            <ChatMarkdown content={summaries[mod.id]} />
                            {summarizing === mod.id && (
                              <motion.span
                                animate={{ opacity: [1, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                                className="inline-block w-0.5 h-4 bg-muted-foreground ml-0.5 align-text-bottom"
                              />
                            )}
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
