// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { SyncProgress } from '@/types';

interface SyncStatusProps {
  status: string;
  progress: SyncProgress | null;
}

export default function SyncStatus({ status, progress }: SyncStatusProps) {
  if (status === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 left-4 md:left-auto bg-background border border-border rounded-2xl p-4 shadow-lg max-w-sm z-[55]"
      >
        <div className="flex items-center gap-3">
          {status === 'syncing' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full shrink-0"
            />
          )}
          {status === 'completed' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0"
            >
              <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          )}
          {status === 'error' && (
            <div className="w-2 h-2 rounded-full bg-destructive shrink-0" />
          )}
          <div>
            <p className="text-sm font-medium">
              {status === 'syncing' && 'Syncing...'}
              {status === 'completed' && 'Sync complete'}
              {status === 'error' && 'Sync failed'}
            </p>
            {progress && (
              <p className="text-xs text-muted-foreground">
                {progress.current_step}
                {progress.total_courses > 0 &&
                  ` (${progress.completed_courses}/${progress.total_courses} courses)`}
              </p>
            )}
            {progress?.error_message && (
              <p className="text-xs text-destructive mt-1">{progress.error_message}</p>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
