'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow, isPast, addDays, isBefore } from 'date-fns';
import type { Assignment, Course } from '@/types';

interface DeadlineListProps {
  assignments: (Assignment & { course?: Course })[];
}

export default function DeadlineList({ assignments }: DeadlineListProps) {
  const [showAll, setShowAll] = useState(false);

  const sortedAssignments = [...assignments]
    .filter((a) => a.due_date && !a.is_completed)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

  const displayCount = showAll ? sortedAssignments.length : 10;
  const displayedAssignments = sortedAssignments.slice(0, displayCount);

  const getUrgencyStyle = (dueDate: string) => {
    const due = new Date(dueDate);
    if (isPast(due)) return 'text-destructive';
    if (isBefore(due, addDays(new Date(), 2))) return 'text-foreground font-medium';
    return 'text-muted-foreground';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="p-6 rounded-2xl border border-border bg-background"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl bg-foreground/5 flex items-center justify-center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Upcoming deadlines</h3>
          {sortedAssignments.length > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">({sortedAssignments.length})</span>
          )}
        </div>
      </div>
      {sortedAssignments.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground mb-1">All caught up!</p>
          <p className="text-xs text-muted-foreground/60">No upcoming deadlines right now</p>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {displayedAssignments.map((assignment, i) => (
              <motion.li
                key={assignment.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{assignment.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {assignment.course?.name || 'Unknown course'}
                  </p>
                </div>
                <span className={`text-xs whitespace-nowrap ${getUrgencyStyle(assignment.due_date!)}`}>
                  {isPast(new Date(assignment.due_date!))
                    ? 'Overdue'
                    : formatDistanceToNow(new Date(assignment.due_date!), { addSuffix: true })}
                </span>
              </motion.li>
            ))}
          </ul>
          {sortedAssignments.length > 10 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAll ? 'Show less' : `Show all ${sortedAssignments.length} deadlines`}
            </button>
          )}
        </>
      )}
    </motion.div>
  );
}
