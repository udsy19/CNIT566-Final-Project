// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import type { Briefing } from '@/types';

export function useBriefing() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBriefing = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/briefing');
      const { data, error } = await res.json();
      if (error) throw new Error(error);
      setBriefing(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch briefing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, []);

  return { briefing, loading, error, refetch: fetchBriefing };
}
