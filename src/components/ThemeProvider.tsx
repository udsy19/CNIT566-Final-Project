// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

'use client';

import { useEffect } from 'react';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const saved = localStorage.getItem('beacon-theme');
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.classList.add(saved);
    }
  }, []);

  return <>{children}</>;
}
