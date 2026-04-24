// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import type { SyncProgress } from '@/types';

export function useSyncStatus() {
  const [status, setStatus] = useState<string>('idle');
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiFetch('/api/sync/status');
      const { data } = await res.json();
      if (data) {
        setStatus(data.sync_status || 'idle');
        setProgress(data.sync_progress);
        setLastSyncedAt(data.last_synced_at);
      }
    } catch {
      // Ignore fetch errors for status polling
    }
  }, []);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(fetchStatus, 2000);
  }, [fetchStatus]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    return stopPolling;
  }, [fetchStatus, stopPolling]);

  useEffect(() => {
    if (status === 'syncing') {
      startPolling();
    } else {
      stopPolling();
    }
  }, [status, startPolling, stopPolling]);

  const startSync = async () => {
    const res = await apiFetch('/api/sync/start', { method: 'POST' });
    if (res.ok) {
      setStatus('syncing');
      startPolling();
    }
  };

  const startRefresh = async () => {
    const res = await apiFetch('/api/sync/refresh', { method: 'POST' });
    if (res.ok) {
      setStatus('syncing');
      startPolling();
    }
  };

  return { status, progress, lastSyncedAt, startSync, startRefresh, refetch: fetchStatus };
}
