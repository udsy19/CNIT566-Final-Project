'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import TopBar from '@/components/layout/TopBar';
import Briefing from '@/components/dashboard/Briefing';
import DeadlineList from '@/components/dashboard/DeadlineList';
import GradeSnapshot from '@/components/dashboard/GradeSnapshot';
import RecentUpdates from '@/components/dashboard/RecentUpdates';
import type { User, Course, Assignment, Announcement, Briefing as BriefingType } from '@/types';

interface DashboardContentProps {
  user: User | null;
}

export default function DashboardContent({ user }: DashboardContentProps) {
  const [syncing, setSyncing] = useState(false);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [briefing, setBriefing] = useState<BriefingType | null>(null);

  const hasBrightspace = !!user?.brightspace_access_token;

  useEffect(() => {
    if (hasBrightspace) {
      loadDashboardData();
    }
  }, [hasBrightspace]);

  const loadDashboardData = async () => {
    try {
      const [coursesRes, assignmentsRes] = await Promise.all([
        apiFetch('/api/courses'),
        apiFetch('/api/assignments?upcoming=true'),
      ]);

      if (coursesRes.ok) {
        const { data } = await coursesRes.json();
        setCourses(data || []);
      }
      if (assignmentsRes.ok) {
        const { data } = await assignmentsRes.json();
        setAssignments(data || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  useEffect(() => {
    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await apiFetch('/api/sync/start', { method: 'POST' });
      syncIntervalRef.current = setInterval(async () => {
        const res = await apiFetch('/api/sync/status');
        const { data } = await res.json();
        if (data?.sync_status === 'completed' || data?.sync_status === 'error') {
          if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
          syncIntervalRef.current = null;
          setSyncing(false);
          loadDashboardData();
        }
      }, 2000);
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncing(false);
    }
  };

  if (!hasBrightspace) {
    return (
      <>
        <TopBar title="Dashboard" />
        <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-lg"
          >
            <p className="text-sm font-mono text-muted-foreground mb-4">Get started</p>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4">
              Connect Brightspace
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Link your Purdue Brightspace account to see your courses, assignments, grades, and more.
            </p>
            <Link
              href="/settings"
              className="inline-block px-8 py-4 rounded-full bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
            >
              Go to Settings
            </Link>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Dashboard" onSync={handleSync} syncing={syncing} />
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <Briefing briefing={briefing} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DeadlineList assignments={assignments} />
          <GradeSnapshot courses={courses} />
        </div>
        <RecentUpdates announcements={announcements} />
      </div>
    </>
  );
}
