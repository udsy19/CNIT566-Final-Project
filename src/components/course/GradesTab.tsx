'use client';

import { useState} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Assignment } from '@/types';

interface GradesTabProps {
  assignments: Assignment[];
  courseGrade: number | null;
  courseName: string;
}

function getLetterGrade(pct: number): string {
  if (pct >= 93) return 'A';
  if (pct >= 90) return 'A-';
  if (pct >= 87) return 'B+';
  if (pct >= 83) return 'B';
  if (pct >= 80) return 'B-';
  if (pct >= 77) return 'C+';
  if (pct >= 73) return 'C';
  if (pct >= 70) return 'C-';
  if (pct >= 67) return 'D+';
  if (pct >= 63) return 'D';
  if (pct >= 60) return 'D-';
  return 'F';
}

function getGradeColor(pct: number): string {
  if (pct >= 90) return 'var(--grade-a)';
  if (pct >= 80) return 'var(--grade-b)';
  if (pct >= 70) return 'var(--grade-c)';
  if (pct >= 60) return 'var(--grade-d)';
  return 'var(--grade-f)';
}

type SortKey = 'name' | 'score' | 'weight' | 'status';

export default function GradesTab({ assignments, courseGrade, courseName }: GradesTabProps) {
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const gradedAssignments = assignments.filter(a => a.points_numerator != null && a.points_denominator != null && a.points_denominator > 0);
  const ungradedAssignments = assignments.filter(a => a.points_numerator == null || a.points_denominator == null || a.points_denominator === 0);

  const totalEarned = gradedAssignments.reduce((s, a) => s + (a.points_numerator || 0), 0);
  const totalPossible = gradedAssignments.reduce((s, a) => s + (a.points_denominator || 0), 0);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(true);
    }
  };

  const sorted = [...gradedAssignments].sort((a, b) => {
    const dir = sortAsc ? 1 : -1;
    switch (sortBy) {
      case 'name':
        return dir * a.name.localeCompare(b.name);
      case 'score': {
        const aPct = (a.points_numerator || 0) / (a.points_denominator || 1) * 100;
        const bPct = (b.points_numerator || 0) / (b.points_denominator || 1) * 100;
        return dir * (aPct - bPct);
      }
      case 'weight':
        return dir * ((a.weight || 0) - (b.weight || 0));
      case 'status':
        return dir * (a.is_completed === b.is_completed ? 0 : a.is_completed ? -1 : 1);
      default:
        return 0;
    }
  });

  const letterGrade = courseGrade != null ? getLetterGrade(courseGrade) : null;

  return (
    <div className="space-y-6">
      {/* Grade summary header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl border border-border bg-background"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">Final Calculated Grade</p>
            <div className="flex items-baseline gap-3">
              {courseGrade != null ? (
                <>
                  <span className="text-4xl font-light tabular-nums">{courseGrade.toFixed(1)}%</span>
                  <span
                    className="text-2xl font-medium"
                    style={{ color: getGradeColor(courseGrade) }}
                  >
                    {letterGrade}
                  </span>
                </>
              ) : (
                <span className="text-2xl text-muted-foreground">No grade yet</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Points</p>
            <p className="text-lg font-light tabular-nums">{totalEarned} / {totalPossible}</p>
          </div>
        </div>

        {/* Grade bar */}
        {courseGrade != null && (
          <div className="mt-4 h-2 rounded-full bg-foreground/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: getGradeColor(courseGrade) }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(courseGrade, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        )}
      </motion.div>

      {/* Grade items table */}
      {gradedAssignments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-background overflow-hidden"
        >
          <div className="px-5 py-3 border-b border-border/40">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Graded Items ({gradedAssignments.length})
            </p>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-5 py-2.5 text-xs text-muted-foreground border-b border-border/30">
            <button onClick={() => handleSort('name')} className="col-span-5 text-left hover:text-foreground transition-colors flex items-center gap-1">
              Item {sortBy === 'name' && <span>{sortAsc ? '↑' : '↓'}</span>}
            </button>
            <button onClick={() => handleSort('score')} className="col-span-3 text-right hover:text-foreground transition-colors flex items-center justify-end gap-1">
              Score {sortBy === 'score' && <span>{sortAsc ? '↑' : '↓'}</span>}
            </button>
            <button onClick={() => handleSort('score')} className="col-span-2 text-right hover:text-foreground transition-colors">
              Grade
            </button>
            <button onClick={() => handleSort('weight')} className="col-span-2 text-right hover:text-foreground transition-colors flex items-center justify-end gap-1">
              Weight {sortBy === 'weight' && <span>{sortAsc ? '↑' : '↓'}</span>}
            </button>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-border/20">
            <AnimatePresence>
              {sorted.map((item, i) => {
                const pct = (item.points_numerator! / item.points_denominator!) * 100;
                const letter = getLetterGrade(pct);
                const expanded = expandedId === item.id;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    <button
                      onClick={() => setExpandedId(expanded ? null : item.id)}
                      className="w-full grid grid-cols-12 gap-2 px-5 py-3 text-sm hover:bg-foreground/[0.02] transition-colors"
                    >
                      <div className="col-span-5 text-left flex items-center gap-2 min-w-0">
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getGradeColor(pct) }}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <div className="col-span-3 text-right tabular-nums text-muted-foreground">
                        {item.points_numerator} / {item.points_denominator}
                      </div>
                      <div className="col-span-2 text-right tabular-nums font-medium" style={{ color: getGradeColor(pct) }}>
                        {pct.toFixed(0)}%
                      </div>
                      <div className="col-span-2 text-right tabular-nums text-muted-foreground">
                        {item.weight != null ? `${item.weight}%` : '—'}
                      </div>
                    </button>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-4 pl-10 space-y-2">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Letter: <strong className="text-foreground">{letter}</strong></span>
                              <span>Type: <strong className="text-foreground">{item.type}</strong></span>
                              {item.due_date && (
                                <span>Due: <strong className="text-foreground">{new Date(item.due_date).toLocaleDateString()}</strong></span>
                              )}
                            </div>
                            {item.instructions && (
                              <p className="text-xs text-muted-foreground line-clamp-2">{item.instructions}</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Ungraded items */}
      {ungradedAssignments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border bg-background overflow-hidden"
        >
          <div className="px-5 py-3 border-b border-border/40">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Not Yet Graded ({ungradedAssignments.length})
            </p>
          </div>
          <div className="divide-y divide-border/20">
            {ungradedAssignments.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="px-5 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 flex-shrink-0" />
                  <span className="text-sm truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {item.due_date && <span>{new Date(item.due_date).toLocaleDateString()}</span>}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    item.is_completed
                      ? 'bg-foreground/5 text-foreground'
                      : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    {item.is_completed ? 'Submitted' : 'Pending'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {assignments.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <p className="text-muted-foreground">No grade data available</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Sync from Brightspace to load grades</p>
        </motion.div>
      )}
    </div>
  );
}
