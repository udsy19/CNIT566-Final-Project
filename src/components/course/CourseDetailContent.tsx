'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AssignmentsTab from './AssignmentsTab';
import ContentTab from './ContentTab';
import CourseChatTab from './CourseChatTab';
import type { Course, Assignment, ContentModule, ContentTopic, Announcement } from '@/types';

interface CourseDetailContentProps {
  course: Course;
  assignments: Assignment[];
  modules: ContentModule[];
  topics: ContentTopic[];
  announcements: Announcement[];
}

type Tab = 'assignments' | 'content' | 'chat';

const tabs: { key: Tab; label: string }[] = [
  { key: 'assignments', label: 'Assignments' },
  { key: 'content', label: 'Content' },
  { key: 'chat', label: 'AI Chat' },
];

function getShortName(name: string): string {
  const match = name.match(/(?:Spring|Fall|Summer)\s+\d{4}\s+(.+?)(?:\s*[-–]\s*(?:Merge|LEC|LAB|DIS|REC|SD)|$)/i);
  if (match) return match[1].replace(/[-–]\d+$/, '').trim();
  return name.split(' ').slice(0, 3).join(' ');
}

export default function CourseDetailContent({ course, assignments, modules, topics, announcements }: CourseDetailContentProps) {
  const [activeTab, setActiveTab] = useState<Tab>('assignments');

  const upcomingCount = assignments.filter(a => a.due_date && new Date(a.due_date) > new Date() && !a.is_completed).length;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Course header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl border border-border bg-background"
      >
        <p className="text-xs font-mono text-muted-foreground mb-2">{course.code || 'Course'}</p>
        <h1 className="text-2xl md:text-3xl font-light tracking-tight mb-4">{getShortName(course.name)}</h1>

        <div className="flex flex-wrap gap-6">
          {course.current_grade != null && (
            <div>
              <p className="text-3xl font-light tabular-nums">{course.current_grade.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">current grade</p>
            </div>
          )}
          <div>
            <p className="text-3xl font-light tabular-nums">{assignments.length}</p>
            <p className="text-xs text-muted-foreground">assignments</p>
          </div>
          <div>
            <p className="text-3xl font-light tabular-nums">{upcomingCount}</p>
            <p className="text-xs text-muted-foreground">upcoming</p>
          </div>
          <div>
            <p className="text-3xl font-light tabular-nums">{modules.length}</p>
            <p className="text-xs text-muted-foreground">modules</p>
          </div>
        </div>
      </motion.div>

      {/* Tab bar */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20'
            }`}
          >
            {tab.label}
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
          {activeTab === 'content' && (
            <ContentTab modules={modules} topics={topics} />
          )}
          {activeTab === 'chat' && (
            <CourseChatTab courseId={course.id} courseName={course.name} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
