'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Settings, LogOut, BookOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { apiFetch } from '@/lib/api';
import type { Course } from '@/types';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ask', label: 'Ask Beacon', icon: MessageSquare },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function getShortName(course: Course): string {
  // Extract department + course number from name like "Spring 2026 CNIT 56600-001 LEC"
  const match = course.name.match(/(?:Spring|Fall|Summer)\s+\d{4}\s+(.+?)(?:\s*[-–]\s*(?:Merge|LEC|LAB|DIS|REC|SD)|$)/i);
  if (match) {
    // Clean up: "CNIT 56600-001" → "CNIT 56600"
    return match[1].replace(/[-–]\d+$/, '').trim();
  }
  // Fallback: first 3 words
  return course.name.split(' ').slice(0, 3).join(' ');
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    apiFetch('/api/courses')
      .then(res => res.ok ? res.json() : { data: [] })
      .then(({ data }) => setCourses(data || []))
      .catch(() => {});
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <aside className="w-64 h-screen bg-background border-r border-border/40 flex flex-col">
      <div className="p-6">
        <Link href="/dashboard" className="text-lg font-mono font-medium hover:opacity-70 transition-opacity">
          [beacon]
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                isActive
                  ? 'bg-foreground text-background font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}

        {courses.length > 0 && (
          <div className="pt-4 mt-4 border-t border-border/40">
            <p className="px-3 text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Courses</p>
            {courses.map((course) => {
              const isActive = pathname === `/course/${course.id}`;
              const shortName = getShortName(course);
              return (
                <Link
                  key={course.id}
                  href={`/course/${course.id}`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                    isActive
                      ? 'bg-foreground text-background font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                  title={course.name}
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{shortName}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-border/40">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
