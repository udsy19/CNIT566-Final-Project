'use client';

import { motion } from 'framer-motion';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-sm font-mono text-muted-foreground mb-2">[dashboard error]</p>
        <h2 className="text-xl font-light tracking-tight mb-2">
          Failed to load dashboard
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {error.message || 'Something went wrong loading your data.'}
        </p>
        <motion.button
          onClick={reset}
          className="px-6 py-2.5 rounded-full bg-foreground text-background font-medium hover:opacity-90 transition-opacity text-sm"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Try again
        </motion.button>
      </motion.div>
    </div>
  );
}
