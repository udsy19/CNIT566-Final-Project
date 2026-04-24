// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Announcement } from '@/types';

interface AnnouncementsTabProps {
  announcements: Announcement[];
}

function decodeHtml(html: string): string {
  const txt = typeof document !== 'undefined' ? document.createElement('textarea') : null;
  if (txt) {
    txt.innerHTML = html;
    return txt.value;
  }
  return html.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AnnouncementsTab({ announcements }: AnnouncementsTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = [...announcements].sort((a, b) =>
    new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
  );

  if (announcements.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16"
      >
        <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
          </svg>
        </div>
        <p className="text-muted-foreground">No announcements yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Announcements from your instructor will appear here</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {sorted.map((ann, i) => {
          const expanded = expandedId === ann.id;
          const hasBody = ann.body && stripHtml(ann.body).length > 0;
          const previewText = hasBody ? stripHtml(decodeHtml(ann.body!)).slice(0, 150) : '';

          return (
            <motion.div
              key={ann.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-2xl border border-border bg-background overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(expanded ? null : ann.id)}
                className="w-full px-4 md:px-5 py-4 text-left hover:bg-foreground/[0.02] active:bg-foreground/[0.04] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{ann.title}</p>
                    {!expanded && previewText && (
                      <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">
                        {previewText}{previewText.length >= 150 ? '...' : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatRelativeDate(ann.created_date)}
                    </span>
                    <svg
                      className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {expanded && hasBody && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 border-t border-border/30 pt-4">
                      <div
                        className="prose prose-sm max-w-none text-sm text-foreground/80
                          [&_a]:text-primary [&_a]:underline
                          [&_ul]:list-disc [&_ul]:pl-5
                          [&_ol]:list-decimal [&_ol]:pl-5
                          [&_p]:mb-2 [&_p]:last:mb-0
                          [&_strong]:font-semibold [&_strong]:text-foreground
                          [&_em]:italic
                          [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:mb-2
                          [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-2
                          [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mb-1
                          [&_table]:border-collapse [&_table]:w-full
                          [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_td]:text-xs
                          [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:text-xs [&_th]:font-semibold [&_th]:bg-foreground/5
                        "
                        dangerouslySetInnerHTML={{ __html: ann.body! }}
                      />
                      <p className="text-xs text-muted-foreground mt-4">
                        Posted {new Date(ann.created_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
