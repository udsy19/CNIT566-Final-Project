'use client';

import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import type { Announcement, Course } from '@/types';

interface RecentUpdatesProps {
  announcements: (Announcement & { course?: Course })[];
}

export default function RecentUpdates({ announcements }: RecentUpdatesProps) {
  const sorted = [...announcements]
    .sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())
    .slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="p-6 rounded-2xl border border-border bg-background"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl bg-foreground/5 flex items-center justify-center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        </div>
        <h3 className="text-sm font-medium">Recent announcements</h3>
      </div>
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No announcements yet.</p>
      ) : (
        <ul className="space-y-3">
          {sorted.map((ann) => (
            <li key={ann.id} className="border-b border-border/40 pb-3 last:border-0 last:pb-0">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{ann.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {ann.course?.name || 'General'}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(ann.created_date), { addSuffix: true })}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
