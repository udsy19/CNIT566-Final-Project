'use client';

import { motion } from 'framer-motion';
import type { Course } from '@/types';

interface GradeSnapshotProps {
  courses: Course[];
}

function getGradeColor(grade: number): string {
  if (grade >= 90) return 'bg-grade-a';
  if (grade >= 80) return 'bg-grade-b';
  if (grade >= 70) return 'bg-grade-c';
  return 'bg-grade-d';
}

function getGradeLetter(grade: number): string {
  if (grade >= 93) return 'A';
  if (grade >= 90) return 'A-';
  if (grade >= 87) return 'B+';
  if (grade >= 83) return 'B';
  if (grade >= 80) return 'B-';
  if (grade >= 77) return 'C+';
  if (grade >= 73) return 'C';
  if (grade >= 70) return 'C-';
  if (grade >= 67) return 'D+';
  if (grade >= 60) return 'D';
  return 'F';
}

function getGradeTextColor(grade: number): string {
  if (grade >= 90) return 'text-grade-a';
  if (grade >= 80) return 'text-grade-b';
  if (grade >= 70) return 'text-grade-c';
  return 'text-grade-d';
}

export default function GradeSnapshot({ courses }: GradeSnapshotProps) {
  const coursesWithGrades = courses.filter((c) => c.current_grade != null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="p-6 rounded-2xl border border-border bg-background"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl bg-foreground/5 flex items-center justify-center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <h3 className="text-sm font-medium">Grades</h3>
      </div>
      {coursesWithGrades.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground mb-1">No grades yet</p>
          <p className="text-xs text-muted-foreground/60">Sync your courses to see grade data</p>
        </div>
      ) : (
        <div className="space-y-4">
          {coursesWithGrades.map((course) => (
            <div key={course.id}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm truncate flex-1">{course.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-medium ${getGradeTextColor(course.current_grade!)}`}>
                    {getGradeLetter(course.current_grade!)}
                  </span>
                  <span className="text-sm font-medium tabular-nums">{course.current_grade?.toFixed(1)}%</span>
                </div>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(course.current_grade!, 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full ${getGradeColor(course.current_grade!)}`}
                />
              </div>
            </div>
          ))}
          {/* GPA average */}
          {coursesWithGrades.length > 1 && (
            <div className="pt-3 border-t border-border/40">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-muted-foreground">Average</span>
                <span className="text-sm font-medium tabular-nums">
                  {(coursesWithGrades.reduce((sum, c) => sum + c.current_grade!, 0) / coursesWithGrades.length).toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
