// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import type { Assignment } from '@/types';

export function useAssignments(options?: { courseId?: string; upcoming?: boolean }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (options?.courseId) params.set('courseId', options.courseId);
      if (options?.upcoming) params.set('upcoming', 'true');

      const res = await apiFetch(`/api/assignments?${params}`);
      const { data, error } = await res.json();
      if (error) throw new Error(error);
      setAssignments(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [options?.courseId, options?.upcoming]);

  return { assignments, loading, error, refetch: fetchAssignments };
}
