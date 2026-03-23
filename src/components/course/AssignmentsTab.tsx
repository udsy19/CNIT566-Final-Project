'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { apiFetch } from '@/lib/api';
import type { Assignment, Announcement } from '@/types';

interface AssignmentsTabProps {
  assignments: Assignment[];
  announcements: Announcement[];
  courseId: string;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&#160;/g, ' ');
}

export default function AssignmentsTab({ assignments, announcements, courseId }: AssignmentsTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Record<string, string>>({});
  const [analyzing, setAnalyzing] = useState<string | null>(null);

  const sorted = [...assignments].sort((a, b) => {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
  });

  const handleAnalyze = async (assignmentId: string) => {
    if (analysis[assignmentId]) return; // Already analyzed
    setAnalyzing(assignmentId);

    try {
      const res = await apiFetch('/api/assignments/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId }),
      });

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';
      let content = '';

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
              content += parsed.content;
              setAnalysis((prev) => ({ ...prev, [assignmentId]: content }));
            }
          } catch {
            // skip unparseable chunks
          }
        }
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      setAnalysis((prev) => ({ ...prev, [assignmentId]: 'Failed to analyze assignment.' }));
    } finally {
      setAnalyzing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl border border-border bg-background">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
          Assignments ({assignments.length})
        </p>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No assignments.</p>
        ) : (
          <div className="space-y-1">
            {sorted.map((a) => {
              const isExpanded = expandedId === a.id;
              const isPast = a.due_date && new Date(a.due_date) < new Date();
              return (
                <div key={a.id}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : a.id)}
                    className="w-full flex items-center justify-between gap-4 px-3 py-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.type}{a.due_date ? ` — ${new Date(a.due_date).toLocaleDateString()}` : ''}
                        {isPast && !a.is_completed ? ' (past due)' : ''}
                      </p>
                    </div>
                    {a.points_numerator != null && a.points_denominator != null && a.points_denominator > 0 && (
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {a.points_numerator}/{a.points_denominator}
                      </span>
                    )}
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
                        <div className="px-3 pb-4 space-y-3">
                          {a.instructions && (
                            <div className="p-4 rounded-xl bg-muted/30 text-sm text-muted-foreground leading-relaxed">
                              {decodeHtmlEntities(a.instructions)}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            {a.due_date && <span>Due: {new Date(a.due_date).toLocaleString()}</span>}
                            {a.points_denominator && <span>Points: {a.points_denominator}</span>}
                            {a.weight && <span>Weight: {a.weight}%</span>}
                            <span>Status: {a.is_completed ? 'Completed' : 'Pending'}</span>
                          </div>

                          {/* AI Analysis */}
                          <motion.button
                            onClick={() => handleAnalyze(a.id)}
                            disabled={analyzing === a.id}
                            className="px-4 py-2 rounded-full text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all disabled:opacity-50"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {analyzing === a.id ? 'Analyzing...' : analysis[a.id] ? 'Re-analyze' : 'Analyze with AI'}
                          </motion.button>

                          {analysis[a.id] && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="p-4 rounded-xl border border-border/50 bg-background"
                            >
                              <p className="text-xs font-mono text-muted-foreground mb-2">ai analysis</p>
                              <div className="prose prose-sm max-w-none text-muted-foreground [&_strong]:text-foreground leading-relaxed">
                                <ReactMarkdown>{analysis[a.id]}</ReactMarkdown>
                                {analyzing === a.id && (
                                  <motion.span
                                    animate={{ opacity: [1, 0] }}
                                    transition={{ duration: 0.5, repeat: Infinity }}
                                    className="inline-block w-0.5 h-4 bg-muted-foreground ml-0.5 align-text-bottom"
                                  />
                                )}
                              </div>
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

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="p-6 rounded-2xl border border-border bg-background">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
            Announcements ({announcements.length})
          </p>
          <div className="space-y-3">
            {announcements.slice(0, 5).map((ann) => (
              <div key={ann.id} className="border-b border-border/40 pb-3 last:border-0 last:pb-0">
                <p className="text-sm font-medium">{decodeHtmlEntities(ann.title)}</p>
                <p className="text-xs text-muted-foreground">{new Date(ann.created_date).toLocaleDateString()}</p>
                {ann.body && (
                  <p className="text-sm mt-1 text-muted-foreground leading-relaxed line-clamp-3">
                    {decodeHtmlEntities(ann.body).slice(0, 200)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
