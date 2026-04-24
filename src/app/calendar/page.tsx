// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, isPast,
  addMonths, subMonths, addWeeks, subWeeks,
} from 'date-fns';
import { apiFetch } from '@/lib/api';
import { getShortName } from '@/lib/utils/courseNames';
import TopBar from '@/components/layout/TopBar';
import type { Course, Assignment } from '@/types';

type View = 'month' | 'week';

// Color palette for courses (deterministic by index)
const courseColors = [
  { bg: 'bg-blue-500/10', text: 'text-blue-600', dot: 'bg-blue-500' },
  { bg: 'bg-violet-500/10', text: 'text-violet-600', dot: 'bg-violet-500' },
  { bg: 'bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  { bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-500' },
  { bg: 'bg-rose-500/10', text: 'text-rose-600', dot: 'bg-rose-500' },
  { bg: 'bg-cyan-500/10', text: 'text-cyan-600', dot: 'bg-cyan-500' },
  { bg: 'bg-orange-500/10', text: 'text-orange-600', dot: 'bg-orange-500' },
  { bg: 'bg-pink-500/10', text: 'text-pink-600', dot: 'bg-pink-500' },
];

export default function CalendarPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [filterCourseId, setFilterCourseId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [coursesRes, assignmentsRes] = await Promise.all([
        apiFetch('/api/courses'),
        apiFetch('/api/assignments?upcoming=false'),
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
      console.error('Failed to load calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Course color map
  const courseColorMap = useMemo(() => {
    const map = new Map<string, typeof courseColors[0]>();
    courses.forEach((c, i) => map.set(c.id, courseColors[i % courseColors.length]));
    return map;
  }, [courses]);

  const courseNameMap = useMemo(() => {
    return new Map(courses.map(c => [c.id, getShortName(c.name)]));
  }, [courses]);

  // Filter assignments
  const filteredAssignments = useMemo(() => {
    if (!filterCourseId) return assignments;
    return assignments.filter(a => a.course_id === filterCourseId);
  }, [assignments, filterCourseId]);

  const getAssignmentsForDay = (day: Date) => {
    return filteredAssignments.filter(a => a.due_date && isSameDay(new Date(a.due_date), day));
  };

  // Navigation
  const navigate = (dir: 1 | -1) => {
    if (view === 'month') setCurrentDate(dir === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    else setCurrentDate(dir === 1 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
  };

  const goToday = () => { setCurrentDate(new Date()); setSelectedDay(new Date()); };

  const periodLabel = useMemo(() => {
    if (view === 'month') return format(currentDate, 'MMMM yyyy');
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`;
  }, [view, currentDate]);

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const selectedAssignments = selectedDay ? getAssignmentsForDay(selectedDay) : [];

  // Upcoming deadlines sidebar
  const now = new Date();
  const upcoming = useMemo(() => {
    return filteredAssignments
      .filter(a => a.due_date && !a.is_completed && new Date(a.due_date) > now)
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
      .slice(0, 8);
  }, [filteredAssignments]);

  if (loading) {
    return (
      <>
        <TopBar title="Calendar" />
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded-full w-48 animate-pulse" />
            <div className="h-96 bg-muted rounded-2xl animate-pulse" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Calendar" />
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
        {/* Course filter chips */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={() => setFilterCourseId(null)}
            className={`px-3 py-2 md:py-1.5 rounded-full text-xs font-medium shrink-0 transition-all ${
              !filterCourseId ? 'bg-foreground text-background' : 'border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            All courses
          </button>
          {courses.map(c => {
            const color = courseColorMap.get(c.id)!;
            const isActive = filterCourseId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setFilterCourseId(isActive ? null : c.id)}
                className={`px-3 py-2 md:py-1.5 rounded-full text-xs font-medium shrink-0 transition-all flex items-center gap-1.5 ${
                  isActive ? 'bg-foreground text-background' : 'border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {!isActive && <div className={`w-2 h-2 rounded-full ${color.dot}`} />}
                {getShortName(c.name)}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
          {/* Calendar */}
          <div className="rounded-2xl border border-border bg-background">
            {/* Calendar header */}
            <div className="p-3 md:p-4 border-b border-border/40 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 md:gap-2">
                <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted/50 active:bg-muted text-muted-foreground">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button onClick={goToday} className="text-sm font-medium min-w-[140px] md:min-w-[180px] text-center">
                  {periodLabel}
                </button>
                <button onClick={() => navigate(1)} className="p-2 rounded-lg hover:bg-muted/50 active:bg-muted text-muted-foreground">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={goToday}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border border-border text-muted-foreground hover:text-foreground transition-all hidden md:block"
                >
                  Today
                </button>
                <div className="flex gap-0.5 bg-muted/50 p-1 rounded-full">
                  {(['month', 'week'] as View[]).map(v => (
                    <button
                      key={v}
                      onClick={() => { setView(v); setSelectedDay(null); }}
                      className={`px-2.5 md:px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        view === v ? 'bg-foreground text-background' : 'text-muted-foreground'
                      }`}
                    >
                      {v === 'month' ? 'Month' : 'Week'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Calendar grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${view}-${currentDate.toISOString()}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                {view === 'month' && (
                  <div className="p-2 md:p-3">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 mb-1">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                        <div key={d} className="text-center text-[11px] font-mono text-muted-foreground py-1.5 hidden md:block">{d}</div>
                      ))}
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                        <div key={i} className="text-center text-[11px] font-mono text-muted-foreground py-1.5 md:hidden">{d}</div>
                      ))}
                    </div>
                    {/* Cells */}
                    <div className="grid grid-cols-7 gap-0.5">
                      {monthDays.map(day => {
                        const dayAssigns = getAssignmentsForDay(day);
                        const inMonth = isSameMonth(day, currentDate);
                        const today = isToday(day);
                        const selected = selectedDay && isSameDay(day, selectedDay);
                        return (
                          <button
                            key={day.toISOString()}
                            onClick={() => setSelectedDay(selected ? null : day)}
                            className={`relative p-1 md:p-1.5 min-h-[44px] md:min-h-[56px] rounded-lg text-left transition-colors ${
                              selected ? 'bg-foreground text-background' :
                              today ? 'bg-foreground/10' :
                              'hover:bg-muted/50 active:bg-muted'
                            } ${inMonth ? '' : 'opacity-25'}`}
                          >
                            <span className={`text-xs ${today && !selected ? 'font-medium' : ''}`}>
                              {format(day, 'd')}
                            </span>
                            {dayAssigns.length > 0 && (
                              <div className="flex flex-wrap gap-0.5 mt-0.5">
                                {dayAssigns.length <= 3 ? (
                                  dayAssigns.map(a => {
                                    const color = courseColorMap.get(a.course_id);
                                    return (
                                      <div
                                        key={a.id}
                                        className={`w-1.5 h-1.5 rounded-full ${selected ? 'bg-background' : color?.dot || 'bg-foreground/40'}`}
                                      />
                                    );
                                  })
                                ) : (
                                  <span className={`text-[10px] font-medium ${selected ? 'text-background' : 'text-muted-foreground'}`}>
                                    {dayAssigns.length}
                                  </span>
                                )}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {view === 'week' && (
                  <div className="p-2 md:p-3">
                    {/* Desktop: grid */}
                    <div className="hidden md:grid grid-cols-7 gap-2">
                      {weekDays.map(day => {
                        const dayAssigns = getAssignmentsForDay(day);
                        const today = isToday(day);
                        return (
                          <div key={day.toISOString()} className={`min-h-[140px] p-2 rounded-xl ${today ? 'bg-foreground/5 border border-foreground/10' : ''}`}>
                            <p className={`text-xs font-mono mb-2 ${today ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                              {format(day, 'EEE d')}
                            </p>
                            <div className="space-y-1">
                              {dayAssigns.map(a => {
                                const color = courseColorMap.get(a.course_id);
                                return (
                                  <div key={a.id} className={`text-[11px] p-1.5 rounded-lg ${
                                    isPast(day) && !isToday(day) ? 'bg-destructive/10 text-destructive' : color?.bg || 'bg-muted/50'
                                  }`}>
                                    <p className={`font-medium truncate ${isPast(day) && !isToday(day) ? '' : color?.text || ''}`}>{a.name}</p>
                                    {a.due_date && <p className="text-muted-foreground">{format(new Date(a.due_date), 'h:mm a')}</p>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Mobile: vertical list */}
                    <div className="md:hidden space-y-1">
                      {weekDays.map(day => {
                        const dayAssigns = getAssignmentsForDay(day);
                        const today = isToday(day);
                        return (
                          <div key={day.toISOString()} className={`p-3 rounded-xl ${today ? 'bg-foreground/5 border border-foreground/10' : ''}`}>
                            <p className={`text-xs font-mono mb-1.5 ${today ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                              {format(day, 'EEEE, MMM d')}
                            </p>
                            {dayAssigns.length === 0 ? (
                              <p className="text-xs text-muted-foreground/40">No deadlines</p>
                            ) : (
                              <div className="space-y-1.5">
                                {dayAssigns.map(a => {
                                  const color = courseColorMap.get(a.course_id);
                                  return (
                                    <div key={a.id} className={`flex items-center justify-between p-2.5 rounded-lg ${
                                      isPast(day) && !isToday(day) ? 'bg-destructive/10' : color?.bg || 'bg-muted/50'
                                    }`}>
                                      <div className="min-w-0 flex-1">
                                        <p className={`text-sm font-medium truncate ${isPast(day) && !isToday(day) ? 'text-destructive' : color?.text || ''}`}>{a.name}</p>
                                        <p className="text-xs text-muted-foreground">{courseNameMap.get(a.course_id) || ''}</p>
                                      </div>
                                      {a.due_date && <span className="text-xs text-muted-foreground shrink-0 ml-2">{format(new Date(a.due_date), 'h:mm a')}</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Selected day detail */}
            <AnimatePresence>
              {selectedDay && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-border/40"
                >
                  <div className="p-4 md:p-5">
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">
                      {format(selectedDay, 'EEEE, MMMM d')}
                    </p>
                    {selectedAssignments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No deadlines on this day.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedAssignments.map(a => {
                          const color = courseColorMap.get(a.course_id);
                          const hasGrade = a.points_numerator != null && a.points_denominator != null && a.points_denominator > 0;
                          return (
                            <Link
                              key={a.id}
                              href={`/course/${a.course_id}`}
                              className="flex items-center justify-between p-3 rounded-xl hover:bg-foreground/[0.02] active:bg-foreground/[0.04] transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${color?.dot || 'bg-foreground/30'}`} />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{a.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {courseNameMap.get(a.course_id) || ''}
                                    {a.due_date && ` · ${format(new Date(a.due_date), 'h:mm a')}`}
                                  </p>
                                </div>
                              </div>
                              <div className="shrink-0 ml-2 text-right">
                                {hasGrade ? (
                                  <span className="text-xs tabular-nums font-medium">{a.points_numerator}/{a.points_denominator}</span>
                                ) : a.is_completed ? (
                                  <span className="text-xs text-muted-foreground">Submitted</span>
                                ) : isPast(selectedDay) ? (
                                  <span className="text-xs text-red-500">Missing</span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Pending</span>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Upcoming sidebar — desktop only */}
          <div className="hidden lg:block space-y-4">
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Upcoming</p>
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
              ) : (
                <div className="space-y-3">
                  {upcoming.map(a => {
                    const color = courseColorMap.get(a.course_id);
                    const dueDate = new Date(a.due_date!);
                    const diff = dueDate.getTime() - Date.now();
                    const hoursLeft = Math.floor(diff / 3600000);
                    const daysLeft = Math.floor(hoursLeft / 24);
                    let timeStr = '';
                    if (hoursLeft < 1) timeStr = 'due soon';
                    else if (hoursLeft < 24) timeStr = `${hoursLeft}h`;
                    else if (daysLeft === 1) timeStr = 'tomorrow';
                    else timeStr = `${daysLeft}d`;

                    return (
                      <Link key={a.id} href={`/course/${a.course_id}`} className="block group">
                        <div className="flex items-start gap-2.5">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${color?.dot || 'bg-foreground/30'}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm truncate group-hover:text-foreground transition-colors">{a.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {courseNameMap.get(a.course_id) || ''} · {timeStr}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Course legend */}
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Courses</p>
              <div className="space-y-2">
                {courses.map(c => {
                  const color = courseColorMap.get(c.id)!;
                  const count = assignments.filter(a => a.course_id === c.id && a.due_date && !a.is_completed && new Date(a.due_date) > now).length;
                  return (
                    <div key={c.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${color.dot}`} />
                        <span className="text-sm truncate">{getShortName(c.name)}</span>
                      </div>
                      {count > 0 && (
                        <span className="text-xs text-muted-foreground tabular-nums">{count} due</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
