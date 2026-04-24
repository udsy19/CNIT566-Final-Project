// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { getShortName } from '@/lib/utils/courseNames';
import type { Course, Assignment } from '@/types';

interface BriefingProps {
  courses: Course[];
  assignments: Assignment[];
}

function timeUntil(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff < 0) return 'past due';
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'less than 1h';
  if (h < 24) return `${h}h left`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'tomorrow' : `${d} days`;
}

function getUrgencyColor(dateStr: string): string {
  const h = (new Date(dateStr).getTime() - Date.now()) / 3600000;
  if (h < 0) return 'text-red-500';
  if (h < 12) return 'text-red-500';
  if (h < 48) return 'text-amber-500';
  return 'text-muted-foreground';
}

export default function Briefing({ courses, assignments }: BriefingProps) {
  const [aiInsight, setAiInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightDone, setInsightDone] = useState(false);

  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 3600000);
  const endOfWeek = new Date(now);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));

  const dueSoon = assignments
    .filter(a => a.due_date && !a.is_completed && new Date(a.due_date) > now && new Date(a.due_date) <= in48h)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

  const dueThisWeek = assignments
    .filter(a => a.due_date && !a.is_completed && new Date(a.due_date) > in48h && new Date(a.due_date) <= endOfWeek)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

  // Detect grade concerns: assignments scored below 70%
  const recentLowGrades = assignments
    .filter(a => a.points_numerator != null && a.points_denominator != null && a.points_denominator > 0)
    .filter(a => (a.points_numerator! / a.points_denominator!) < 0.7)
    .slice(-3);

  const courseNameMap = new Map(courses.map(c => [c.id, getShortName(c.name)]));

  // Fetch AI heads-up only if there are grade concerns
  useEffect(() => {
    if (recentLowGrades.length === 0 || insightDone) return;
    fetchAiInsight();
  }, [recentLowGrades.length]);

  const fetchAiInsight = async () => {
    setInsightLoading(true);
    try {
      const res = await apiFetch('/api/briefing?stream=true');
      if (res.headers.get('content-type')?.includes('text/event-stream')) {
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
                setAiInsight(content);
              }
            } catch {}
          }
        }
      } else {
        const { data } = await res.json();
        if (data?.content) setAiInsight(data.content);
      }
    } catch {
      // Silent fail — the data-driven sections still show
    } finally {
      setInsightLoading(false);
      setInsightDone(true);
    }
  };

  // Extract just the "heads up" section from AI response
  const headsUp = (() => {
    if (!aiInsight) return null;
    // Try to find a heads-up / grades section
    const lines = aiInsight.split('\n');
    let capturing = false;
    const items: string[] = [];
    for (const line of lines) {
      const t = line.trim();
      if (/^#{1,3}\s*(heads? up|grades?|watch|attention)/i.test(t)) {
        capturing = true;
        continue;
      }
      if (capturing && /^#{1,3}\s/.test(t)) break; // next section
      if (capturing && t) {
        items.push(t.replace(/^[-*•]\s*/, '').trim());
      }
    }
    if (items.length > 0) return items;
    // Fallback: if no sections found, just take the whole thing but keep it short
    const cleaned = aiInsight
      .replace(/^#{1,3}\s.*$/gm, '')
      .replace(/^[-*•]\s*/gm, '')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.match(/^(all clear|nothing due)/i))
      .slice(0, 2);
    return cleaned.length > 0 ? cleaned : null;
  })();

  const todayStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const isEmpty = dueSoon.length === 0 && dueThisWeek.length === 0 && !headsUp;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-background overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-foreground/5 flex items-center justify-center">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <p className="text-sm font-medium">Daily briefing</p>
        </div>
        <p className="text-xs text-muted-foreground">{todayStr}</p>
      </div>

      <div className="divide-y divide-border/30">
        {/* Due Soon */}
        <div className="px-4 md:px-5 py-3.5">
          <div className="flex items-center gap-2 mb-2.5">
            <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">due soon</p>
          </div>
          {dueSoon.length === 0 ? (
            <p className="text-sm text-muted-foreground ml-5.5">All clear for the next 48 hours</p>
          ) : (
            <div className="space-y-2">
              {dueSoon.map(a => (
                <div key={a.id} className="flex items-start justify-between gap-3 ml-5.5">
                  <div className="min-w-0">
                    <p className="text-sm truncate">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{courseNameMap.get(a.course_id) || ''}</p>
                  </div>
                  <span className={`text-xs font-medium tabular-nums shrink-0 ${getUrgencyColor(a.due_date!)}`}>
                    {timeUntil(a.due_date!)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* This Week */}
        {dueThisWeek.length > 0 && (
          <div className="px-4 md:px-5 py-3.5">
            <div className="flex items-center gap-2 mb-2.5">
              <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">this week</p>
            </div>
            <div className="space-y-2">
              {dueThisWeek.map(a => (
                <div key={a.id} className="flex items-start justify-between gap-3 ml-5.5">
                  <div className="min-w-0">
                    <p className="text-sm truncate">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{courseNameMap.get(a.course_id) || ''}</p>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                    {new Date(a.due_date!).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Heads Up — grade issues, patterns */}
        <AnimatePresence>
          {(headsUp || insightLoading) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-4 md:px-5 py-3.5"
            >
              <div className="flex items-center gap-2 mb-2.5">
                <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">heads up</p>
              </div>
              {headsUp ? (
                <div className="space-y-1 ml-5.5">
                  {headsUp.map((item, i) => {
                    const parts = item.split(/\*\*([^*]+)\*\*/g);
                    return (
                      <p key={i} className="text-sm text-foreground/80 leading-relaxed">
                        {parts.map((part, pi) =>
                          pi % 2 === 1
                            ? <span key={pi} className="font-medium text-foreground">{part}</span>
                            : <span key={pi}>{part}</span>
                        )}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2 ml-5.5">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-3.5 h-3.5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full"
                  />
                  <span className="text-xs text-muted-foreground">Checking your grades...</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* All clear state */}
        {isEmpty && !insightLoading && (
          <div className="px-4 md:px-5 py-4">
            <p className="text-sm text-muted-foreground">Nothing urgent. You&apos;re on track.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
