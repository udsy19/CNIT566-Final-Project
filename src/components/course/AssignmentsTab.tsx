'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatMarkdown from '@/components/ui/ChatMarkdown';
import { apiFetch } from '@/lib/api';
import type { Assignment } from '@/types';

interface AssignmentsTabProps {
  assignments: Assignment[];
  announcements: unknown[];
  courseId: string;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&#160;/g, ' ');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function getTimeRemaining(dueDate: string): { text: string; urgent: boolean } {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = due.getTime() - now.getTime();

  if (diff < 0) return { text: 'Past due', urgent: true };
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (hours < 24) return { text: `${hours}h remaining`, urgent: true };
  if (days < 3) return { text: `${days}d ${hours % 24}h remaining`, urgent: true };
  if (days < 7) return { text: `${days} days remaining`, urgent: false };
  return { text: `${days} days remaining`, urgent: false };
}

type Filter = 'all' | 'upcoming' | 'past' | 'graded';

export default function AssignmentsTab({ assignments, courseId }: AssignmentsTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Record<string, string>>({});
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  const now = new Date();

  const filtered = assignments.filter(a => {
    switch (filter) {
      case 'upcoming':
        return a.due_date && new Date(a.due_date) > now && !a.is_completed;
      case 'past':
        return a.due_date && new Date(a.due_date) < now;
      case 'graded':
        return a.points_numerator != null && a.points_denominator != null && a.points_denominator > 0;
      default:
        return true;
    }
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  const handleAnalyze = async (assignmentId: string) => {
    if (analysis[assignmentId]) return;
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
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      setAnalysis((prev) => ({ ...prev, [assignmentId]: 'Failed to analyze.' }));
    } finally {
      setAnalyzing(null);
    }
  };

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: assignments.length },
    { key: 'upcoming', label: 'Upcoming', count: assignments.filter(a => a.due_date && new Date(a.due_date) > now && !a.is_completed).length },
    { key: 'past', label: 'Past', count: assignments.filter(a => a.due_date && new Date(a.due_date) < now).length },
    { key: 'graded', label: 'Graded', count: assignments.filter(a => a.points_numerator != null && a.points_denominator != null && a.points_denominator > 0).length },
  ];

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex gap-2 overflow-x-auto">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
              filter === f.key
                ? 'bg-foreground/10 text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
            <span className="tabular-nums opacity-60">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Assignment list */}
      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        {sorted.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No assignments match this filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {sorted.map((a, i) => {
              const isExpanded = expandedId === a.id;
              const isPast = a.due_date && new Date(a.due_date) < now;
              const hasGrade = a.points_numerator != null && a.points_denominator != null && a.points_denominator > 0;
              const pct = hasGrade ? ((a.points_numerator! / a.points_denominator!) * 100) : null;
              const remaining = a.due_date ? getTimeRemaining(a.due_date) : null;

              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                >
                  {/* Assignment row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : a.id)}
                    className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-foreground/[0.02] transition-colors text-left ${isPast && !hasGrade ? 'opacity-60' : ''}`}
                  >
                    {/* Status indicator */}
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      hasGrade
                        ? pct! >= 70 ? 'bg-emerald-500' : pct! >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        : a.is_completed
                          ? 'bg-foreground/30'
                          : isPast
                            ? 'bg-red-400'
                            : 'bg-blue-400'
                    }`} />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {a.type === 'quiz' ? '📝 Quiz' : '📄 Assignment'}
                        </span>
                        {a.due_date && (
                          <span className="text-xs text-muted-foreground">
                            · {new Date(a.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Score or status badge */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {hasGrade ? (
                        <div className="text-right">
                          <p className="text-sm tabular-nums font-medium">{a.points_numerator}/{a.points_denominator}</p>
                          <p className={`text-xs tabular-nums ${pct! >= 70 ? 'text-emerald-600' : pct! >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                            {pct!.toFixed(0)}%
                          </p>
                        </div>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          a.is_completed
                            ? 'bg-foreground/5 text-foreground/60'
                            : isPast
                              ? 'bg-red-500/10 text-red-600'
                              : 'bg-blue-500/10 text-blue-600'
                        }`}>
                          {a.is_completed ? 'Submitted' : isPast ? 'Missing' : 'Pending'}
                        </span>
                      )}
                      <svg
                        className={`w-4 h-4 text-muted-foreground/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded detail drawer */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 space-y-4 border-t border-border/20 pt-4 ml-6">
                          {/* Detail cards row */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {a.due_date && (
                              <div className="p-3 rounded-xl bg-foreground/[0.03]">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Due date</p>
                                <p className="text-sm mt-1">{new Date(a.due_date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                                {remaining && (
                                  <p className={`text-xs mt-0.5 ${remaining.urgent ? 'text-red-500' : 'text-muted-foreground'}`}>
                                    {remaining.text}
                                  </p>
                                )}
                              </div>
                            )}
                            <div className="p-3 rounded-xl bg-foreground/[0.03]">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</p>
                              <p className="text-sm mt-1">{a.is_completed ? '✓ Submitted' : isPast ? '✕ Not submitted' : 'Pending'}</p>
                            </div>
                            {a.points_denominator != null && a.points_denominator > 0 && (
                              <div className="p-3 rounded-xl bg-foreground/[0.03]">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Score</p>
                                <p className="text-sm mt-1 tabular-nums">
                                  {a.points_numerator != null ? `${a.points_numerator}/${a.points_denominator}` : `— /${a.points_denominator}`}
                                </p>
                              </div>
                            )}
                            {a.weight != null && (
                              <div className="p-3 rounded-xl bg-foreground/[0.03]">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Weight</p>
                                <p className="text-sm mt-1 tabular-nums">{a.weight}%</p>
                              </div>
                            )}
                          </div>

                          {/* Instructions */}
                          {a.instructions && (
                            <div className="p-4 rounded-xl bg-foreground/[0.02] border border-border/30">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Instructions</p>
                              <div
                                className="text-sm text-foreground/80 leading-relaxed
                                  [&_a]:text-blue-600 [&_a]:underline
                                  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1
                                  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1
                                  [&_p]:mb-2 [&_p]:last:mb-0"
                                dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(a.instructions) }}
                              />
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <motion.button
                              onClick={() => handleAnalyze(a.id)}
                              disabled={analyzing === a.id}
                              className="px-4 py-2 rounded-full text-xs font-medium bg-foreground text-background hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                              </svg>
                              {analyzing === a.id ? 'Analyzing...' : analysis[a.id] ? 'Re-analyze' : 'Analyze with AI'}
                            </motion.button>
                            <a
                              href={`https://purdue.brightspace.com/d2l/lms/dropbox/user/folder_submit_files.d2l?db=${a.brightspace_id}&grpid=0&isprv=0&bp=0&ou=${a.course_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 rounded-full text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all flex items-center gap-1.5"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                              </svg>
                              Open in Brightspace
                            </a>
                          </div>

                          {/* AI Analysis result */}
                          {analysis[a.id] && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-4 rounded-xl border border-border/50 bg-background"
                            >
                              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">AI Analysis</p>
                              <div>
                                <ChatMarkdown content={analysis[a.id]} />
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
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
