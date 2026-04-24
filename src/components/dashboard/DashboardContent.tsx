// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { getShortName } from '@/lib/utils/courseNames';
import TopBar from '@/components/layout/TopBar';
import Briefing from '@/components/dashboard/Briefing';
import DeadlineList from '@/components/dashboard/DeadlineList';
import GradeSnapshot from '@/components/dashboard/GradeSnapshot';
import RecentUpdates from '@/components/dashboard/RecentUpdates';
import { checkDeadlineNotifications } from '@/lib/notifications';
import type { User, Course, Assignment, Announcement } from '@/types';

interface DashboardContentProps {
  user: User | null;
}

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  type: 'assignment' | 'custom';
  courseId?: string;
  dueDate?: string;
}

const CHECKLIST_KEY = 'beacon-checklist';
const CHECKLIST_DATE_KEY = 'beacon-checklist-date';

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardContent({ user }: DashboardContentProps) {
  const [syncing, setSyncing] = useState(false);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  // Checklist state
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newTask, setNewTask] = useState('');
  const [checklistReady, setChecklistReady] = useState(false);

  const hasBrightspace = !!user?.brightspace_access_token;

  useEffect(() => {
    if (hasBrightspace) {
      loadDashboardData();
    }
  }, [hasBrightspace]);

  // Load checklist from localStorage
  useEffect(() => {
    const today = getTodayStr();
    const savedDate = localStorage.getItem(CHECKLIST_DATE_KEY);
    if (savedDate === today) {
      try {
        const saved = JSON.parse(localStorage.getItem(CHECKLIST_KEY) || '[]');
        setChecklist(saved);
      } catch {
        setChecklist([]);
      }
    } else {
      // New day — reset custom tasks, regenerate from assignments
      localStorage.setItem(CHECKLIST_DATE_KEY, today);
      setChecklist([]);
    }
    setChecklistReady(true);
  }, []);

  // Auto-populate checklist from assignments due today/tomorrow
  useEffect(() => {
    if (!checklistReady || assignments.length === 0) return;

    const now = new Date();
    const endOfTomorrow = new Date(now);
    endOfTomorrow.setDate(endOfTomorrow.getDate() + 2);
    endOfTomorrow.setHours(0, 0, 0, 0);

    const dueItems = assignments
      .filter(a => {
        if (!a.due_date || a.is_completed) return false;
        const due = new Date(a.due_date);
        return due > now && due < endOfTomorrow;
      })
      .map(a => ({
        id: `assignment-${a.id}`,
        text: a.name,
        done: false,
        type: 'assignment' as const,
        courseId: a.course_id,
        dueDate: a.due_date!,
      }));

    setChecklist(prev => {
      // Merge: keep existing custom tasks + checked states, add new assignments
      const existingIds = new Set(prev.map(i => i.id));
      const existingChecks = new Map(prev.map(i => [i.id, i.done]));
      const merged = [
        ...dueItems.map(item => ({
          ...item,
          done: existingChecks.get(item.id) ?? false,
        })),
        ...prev.filter(i => i.type === 'custom'),
      ];
      // Only add genuinely new assignment items
      for (const item of dueItems) {
        if (!existingIds.has(item.id) && !merged.find(m => m.id === item.id)) {
          merged.push(item);
        }
      }
      return merged;
    });
  }, [assignments, checklistReady]);

  // Check deadline notifications
  useEffect(() => {
    if (assignments.length === 0 || courses.length === 0) return;
    const courseNames = new Map(courses.map(c => [c.id, getShortName(c.name)]));
    checkDeadlineNotifications(assignments, courseNames);

    // Re-check every 5 minutes
    const interval = setInterval(() => {
      checkDeadlineNotifications(assignments, courseNames);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [assignments, courses]);

  // Persist checklist
  useEffect(() => {
    if (checklistReady) {
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checklist));
    }
  }, [checklist, checklistReady]);

  const toggleItem = (id: string) => {
    setChecklist(prev => prev.map(item =>
      item.id === id ? { ...item, done: !item.done } : item
    ));
  };

  const addCustomTask = () => {
    if (!newTask.trim()) return;
    setChecklist(prev => [...prev, {
      id: `custom-${Date.now()}`,
      text: newTask.trim(),
      done: false,
      type: 'custom',
    }]);
    setNewTask('');
  };

  const removeItem = (id: string) => {
    setChecklist(prev => prev.filter(i => i.id !== id));
  };

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
            <div className="w-16 h-16 rounded-2xl bg-foreground/5 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.864-4.243a4.5 4.5 0 00-6.364 0l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
            </div>
            <p className="text-sm font-mono text-muted-foreground mb-4">get started</p>
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

  // Quick stats calculations
  const upcomingCount = assignments.filter(a => a.due_date && new Date(a.due_date) > new Date() && !a.is_completed).length;
  const coursesWithGrades = courses.filter(c => c.current_grade != null);
  const avgGrade = coursesWithGrades.length > 0
    ? coursesWithGrades.reduce((sum, c) => sum + c.current_grade!, 0) / coursesWithGrades.length
    : null;

  const completedTasks = checklist.filter(i => i.done).length;
  const totalTasks = checklist.length;

  const getCourseName = (courseId?: string) => {
    if (!courseId) return '';
    const course = courses.find(c => c.id === courseId);
    return course ? getShortName(course.name) : '';
  };

  const formatDueTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'due soon';
    if (hours < 24) return `in ${hours}h`;
    return `tomorrow`;
  };

  return (
    <>
      <TopBar title="Dashboard" onSync={handleSync} syncing={syncing} />
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-5xl mx-auto">
        {/* Quick stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="p-3 md:p-4 rounded-2xl border border-border bg-background text-center">
            <p className="text-xl md:text-2xl font-light tabular-nums">{courses.length}</p>
            <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5">Courses</p>
          </div>
          <div className="p-3 md:p-4 rounded-2xl border border-border bg-background text-center">
            <p className="text-xl md:text-2xl font-light tabular-nums">{upcomingCount}</p>
            <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5">Upcoming</p>
          </div>
          <div className="p-3 md:p-4 rounded-2xl border border-border bg-background text-center">
            <p className="text-xl md:text-2xl font-light tabular-nums">{avgGrade != null ? `${avgGrade.toFixed(1)}%` : '—'}</p>
            <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5">Avg Grade</p>
          </div>
          <div className="p-3 md:p-4 rounded-2xl border border-border bg-background text-center">
            <p className="text-xl md:text-2xl font-light tabular-nums">{assignments.length}</p>
            <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5">Assignments</p>
          </div>
        </motion.div>

        {/* Today's Tasks Checklist */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-2xl border border-border bg-background"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-foreground/5 flex items-center justify-center">
                <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Today&apos;s tasks</p>
                <p className="text-xs text-muted-foreground">
                  {totalTasks === 0 ? 'Nothing due — add your own tasks' : `${completedTasks}/${totalTasks} complete`}
                </p>
              </div>
            </div>
            {totalTasks > 0 && (
              <div className="w-16 h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-foreground"
                  initial={{ width: 0 }}
                  animate={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {checklist.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, height: 0 }}
                  className={`group flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-xl transition-colors ${item.done ? 'opacity-50' : 'hover:bg-foreground/[0.03] active:bg-foreground/[0.05]'}`}
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                      item.done
                        ? 'bg-foreground border-foreground'
                        : 'border-border hover:border-foreground/40'
                    }`}
                  >
                    {item.done && (
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-3 h-3 text-background"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </motion.svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${item.done ? 'line-through' : ''}`}>
                      {item.text}
                    </p>
                    {item.type === 'assignment' && (
                      <p className="text-xs text-muted-foreground">
                        {getCourseName(item.courseId)}
                        {item.dueDate && ` · ${formatDueTime(item.dueDate)}`}
                      </p>
                    )}
                  </div>
                  {item.type === 'custom' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                      className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1.5 -mr-1.5 text-muted-foreground hover:text-foreground active:text-foreground transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Add custom task */}
          <form
            onSubmit={(e) => { e.preventDefault(); addCustomTask(); }}
            className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40"
          >
            <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a task..."
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/40"
            />
            {newTask.trim() && (
              <motion.button
                type="submit"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-xs px-3 py-1 rounded-full bg-foreground text-background"
              >
                Add
              </motion.button>
            )}
          </form>
        </motion.div>

        {/* AI Briefing */}
        <Briefing courses={courses} assignments={assignments} />

        {/* Deadlines + Grades side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DeadlineList assignments={assignments} />
          <GradeSnapshot courses={courses} />
        </div>

        {/* Course cards grid */}
        {courses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Your courses</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course, i) => {
                const courseAssignments = assignments.filter(a => a.course_id === course.id);
                const courseUpcoming = courseAssignments.filter(a => a.due_date && new Date(a.due_date) > new Date() && !a.is_completed).length;
                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    whileHover={{ y: -4 }}
                  >
                    <Link
                      href={`/course/${course.id}`}
                      className="block p-4 md:p-5 rounded-2xl border border-border bg-background hover:border-foreground/20 active:bg-foreground/[0.02] transition-colors"
                    >
                      <p className="text-sm font-medium mb-3 truncate">{getShortName(course.name)}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {course.current_grade != null && (
                          <span className="tabular-nums">{course.current_grade.toFixed(1)}%</span>
                        )}
                        {courseUpcoming > 0 && (
                          <span>{courseUpcoming} due</span>
                        )}
                        <span>{courseAssignments.length} total</span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Recent Announcements */}
        <RecentUpdates announcements={announcements} />
      </div>
    </>
  );
}
