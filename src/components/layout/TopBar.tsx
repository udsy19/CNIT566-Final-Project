'use client';

import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopBarProps {
  title: string;
  onSync?: () => void;
  syncing?: boolean;
}

export default function TopBar({ title, onSync, syncing }: TopBarProps) {
  return (
    <header className="h-14 border-b border-border/40 bg-background/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40">
      <h2 className="text-sm font-medium">{title}</h2>
      <div className="flex items-center gap-3">
        {onSync && (
          <motion.button
            onClick={onSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20 transition-all disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync'}
          </motion.button>
        )}
      </div>
    </header>
  );
}
