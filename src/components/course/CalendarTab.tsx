// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, isPast,
  addMonths, subMonths, addWeeks, subWeeks, addDays, subDays,
} from 'date-fns';
import type { Assignment } from '@/types';

type View = 'month' | 'week' | 'day';

interface CalendarTabProps {
  assignments: Assignment[];
}

export default function CalendarTab({ assignments }: CalendarTabProps) {
  const [view, setView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const navigate = (dir: 1 | -1) => {
    if (view === 'month') setCurrentDate(dir === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(dir === 1 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    else setCurrentDate(dir === 1 ? addDays(currentDate, 1) : subDays(currentDate, 1));
  };

  const goToday = () => setCurrentDate(new Date());

  const periodLabel = useMemo(() => {
    if (view === 'month') return format(currentDate, 'MMMM yyyy');
    if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`;
    }
    return format(currentDate, 'EEE, MMM d');
  }, [view, currentDate]);

  const getAssignmentsForDay = (day: Date) => {
    return assignments.filter(a => a.due_date && isSameDay(new Date(a.due_date), day));
  };

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

  const dayAssignments = useMemo(() => getAssignmentsForDay(currentDate), [currentDate, assignments]);
  const selectedAssignments = selectedDay ? getAssignmentsForDay(selectedDay) : [];

  const views: { key: View; label: string }[] = [
    { key: 'day', label: 'Day' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
  ];

  return (
    <div className="rounded-2xl border border-border bg-background">
      {/* Header */}
      <div className="p-3 md:p-4 border-b border-border/40 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 md:gap-2">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted/50 active:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={goToday} className="text-sm font-medium min-w-[120px] md:min-w-[160px] text-center">
            {periodLabel}
          </button>
          <button onClick={() => navigate(1)} className="p-2 rounded-lg hover:bg-muted/50 active:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="flex gap-0.5 bg-muted/50 p-1 rounded-full">
          {views.map(v => (
            <button
              key={v.key}
              onClick={() => { setView(v.key); setSelectedDay(null); }}
              className={`px-2.5 md:px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                view === v.key ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${view}-${currentDate.toISOString()}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {view === 'month' && (
            <div className="p-2 md:p-3">
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <div key={i} className="text-center text-[11px] font-mono text-muted-foreground py-1.5">{d}</div>
                ))}
              </div>
              {/* Day cells */}
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
                      className={`relative p-1 md:p-1.5 min-h-[44px] rounded-lg text-center transition-colors ${
                        selected ? 'bg-foreground text-background' :
                        today ? 'bg-foreground/10' :
                        'hover:bg-muted/50 active:bg-muted'
                      } ${inMonth ? '' : 'opacity-30'}`}
                    >
                      <span className={`text-xs ${today && !selected ? 'font-medium' : ''}`}>
                        {format(day, 'd')}
                      </span>
                      {dayAssigns.length > 0 && (
                        <div className="flex justify-center gap-0.5 mt-0.5">
                          {dayAssigns.length <= 3 ? (
                            dayAssigns.map((_, i) => (
                              <div key={i} className={`w-1 h-1 rounded-full ${selected ? 'bg-background' : isPast(day) && !isToday(day) ? 'bg-destructive' : 'bg-foreground/40'}`} />
                            ))
                          ) : (
                            <span className={`text-[10px] font-medium ${selected ? 'text-background' : 'text-muted-foreground'}`}>{dayAssigns.length}</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {/* Selected day detail */}
              <AnimatePresence>
                {selectedDay && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 mt-3 border-t border-border/40">
                      <p className="text-xs font-mono text-muted-foreground mb-2">{format(selectedDay, 'EEEE, MMM d')}</p>
                      {selectedAssignments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No assignments due.</p>
                      ) : (
                        <div className="space-y-2">
                          {selectedAssignments.map(a => (
                            <div key={a.id} className="flex justify-between items-center text-sm py-1">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">{a.name}</p>
                                <p className="text-xs text-muted-foreground">{a.type} {a.due_date ? `· ${format(new Date(a.due_date), 'h:mm a')}` : ''}</p>
                              </div>
                              {a.points_denominator && (
                                <span className="text-xs text-muted-foreground tabular-nums shrink-0 ml-2">{a.points_denominator}pts</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {view === 'week' && (
            <div className="p-2 md:p-3">
              {/* Mobile: vertical list. Desktop: 7-column grid */}
              <div className="hidden md:grid grid-cols-7 gap-2">
                {weekDays.map(day => {
                  const dayAssigns = getAssignmentsForDay(day);
                  const today = isToday(day);
                  return (
                    <div key={day.toISOString()} className={`min-h-[120px] p-2 rounded-xl ${today ? 'bg-foreground/5 border border-foreground/10' : ''}`}>
                      <p className={`text-xs font-mono mb-2 ${today ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {format(day, 'EEE d')}
                      </p>
                      <div className="space-y-1">
                        {dayAssigns.map(a => (
                          <div key={a.id} className={`text-[11px] p-1.5 rounded-lg ${isPast(day) && !isToday(day) ? 'bg-destructive/10 text-destructive' : 'bg-muted/50'}`}>
                            <p className="font-medium truncate">{a.name}</p>
                            {a.due_date && <p className="text-muted-foreground">{format(new Date(a.due_date), 'h:mm a')}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Mobile: vertical day list */}
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
                        <p className="text-xs text-muted-foreground/50">No assignments</p>
                      ) : (
                        <div className="space-y-1.5">
                          {dayAssigns.map(a => (
                            <div key={a.id} className={`text-sm flex items-center justify-between p-2.5 rounded-lg ${isPast(day) && !isToday(day) ? 'bg-destructive/10 text-destructive' : 'bg-muted/50'}`}>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">{a.name}</p>
                              </div>
                              {a.due_date && <span className="text-xs text-muted-foreground shrink-0 ml-2">{format(new Date(a.due_date), 'h:mm a')}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === 'day' && (
            <div className="p-3 md:p-4">
              {dayAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No assignments due {isToday(currentDate) ? 'today' : `on ${format(currentDate, 'MMM d')}`}.</p>
              ) : (
                <div className="space-y-2 md:space-y-3">
                  {dayAssignments.map(a => (
                    <div key={a.id} className="flex justify-between items-start p-3 rounded-xl border border-border/50">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{a.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {a.type} {a.due_date ? `· Due ${format(new Date(a.due_date), 'h:mm a')}` : ''}
                        </p>
                      </div>
                      {a.points_denominator && (
                        <span className="text-sm tabular-nums text-muted-foreground shrink-0 ml-2">{a.points_denominator}pts</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
