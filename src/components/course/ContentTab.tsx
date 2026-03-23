'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ContentModule, ContentTopic } from '@/types';

interface ContentTabProps {
  modules: ContentModule[];
  topics: ContentTopic[];
}

export default function ContentTab({ modules, topics }: ContentTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="p-6 rounded-2xl border border-border bg-background">
      <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
        Content Modules ({modules.length})
      </p>
      {modules.length === 0 ? (
        <p className="text-sm text-muted-foreground">No content modules.</p>
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
                  {isExpanded && modTopics.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <ul className="px-3 pb-3 ml-9 space-y-1.5">
                        {modTopics.map((topic) => (
                          <li key={topic.id} className="text-sm text-muted-foreground">
                            {topic.url ? (
                              <a
                                href={topic.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-foreground transition-colors flex items-center gap-1.5"
                              >
                                {topic.title}
                                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            ) : (
                              topic.title
                            )}
                          </li>
                        ))}
                      </ul>
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
