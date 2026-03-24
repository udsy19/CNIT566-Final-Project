'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import AssignmentsTab from './AssignmentsTab';
import ContentTab from './ContentTab';
import CourseChatTab from './CourseChatTab';
import CalendarTab from './CalendarTab';
import GradesTab from './GradesTab';
import AnnouncementsTab from './AnnouncementsTab';
import ProfessorCard from './ProfessorCard';
import { getShortName } from '@/lib/utils/courseNames';
import type { Course, Assignment, ContentModule, ContentTopic, Announcement } from '@/types';

interface CourseDetailContentProps {
  course: Course;
  assignments: Assignment[];
  modules: ContentModule[];
  topics: ContentTopic[];
  announcements: Announcement[];
}

type Tab = 'assignments' | 'calendar' | 'content' | 'grades' | 'announcements' | 'chat';

const tabs: { key: Tab; label: string }[] = [
  { key: 'assignments', label: 'Assignments' },
  { key: 'grades', label: 'Grades' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'content', label: 'Content' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'chat', label: 'AI Chat' },
];

export default function CourseDetailContent({ course, assignments, modules, topics, announcements }: CourseDetailContentProps) {
  const [activeTab, setActiveTab] = useState<Tab>('assignments');

  const upcomingCount = assignments.filter(a => a.due_date && new Date(a.due_date) > new Date() && !a.is_completed).length;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium truncate">{getShortName(course.name)}</span>
      </nav>

      {/* Course header + Professor info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 p-4 md:p-6 rounded-2xl border border-border bg-background"
        >
          <p className="text-xs font-mono text-muted-foreground mb-2">{course.code || 'Course'}</p>
          <h1 className="text-2xl md:text-3xl font-light tracking-tight mb-4">{getShortName(course.name)}</h1>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
            {course.current_grade != null && (
              <div>
                <p className="text-2xl md:text-3xl font-light tabular-nums">{course.current_grade.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">current grade</p>
              </div>
            )}
            <div>
              <p className="text-2xl md:text-3xl font-light tabular-nums">{assignments.length}</p>
              <p className="text-xs text-muted-foreground">assignments</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-light tabular-nums">{upcomingCount}</p>
              <p className="text-xs text-muted-foreground">upcoming</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-light tabular-nums">{modules.length}</p>
              <p className="text-xs text-muted-foreground">modules</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ProfessorCard courseId={course.id} courseName={course.name} />
        </motion.div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-5 py-2 rounded-full text-sm font-medium transition-colors shrink-0 ${
              activeTab === tab.key
                ? 'text-background'
                : 'text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20'
            }`}
          >
            {activeTab === tab.key && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-foreground rounded-full"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'assignments' && (
            <AssignmentsTab assignments={assignments} announcements={announcements} courseId={course.id} />
          )}
          {activeTab === 'grades' && (
            <GradesTab assignments={assignments} courseGrade={course.current_grade} courseName={getShortName(course.name)} />
          )}
          {activeTab === 'calendar' && (
            <CalendarTab assignments={assignments} />
          )}
          {activeTab === 'content' && (
            <ContentTab modules={modules} topics={topics} />
          )}
          {activeTab === 'announcements' && (
            <AnnouncementsTab announcements={announcements} />
          )}
          {activeTab === 'chat' && (
            <CourseChatTab courseId={course.id} courseName={course.name} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
