'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Settings, LogOut, BookOpen, Menu, X, Sun, Moon, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { apiFetch } from '@/lib/api';
import { getShortName } from '@/lib/utils/courseNames';
import type { Course } from '@/types';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ask', label: 'Ask Beacon', icon: MessageSquare },
  { href: '/settings', label: 'Settings', icon: Settings },
];

type Theme = 'light' | 'dark' | 'system';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    apiFetch('/api/courses')
      .then(res => res.ok ? res.json() : { data: [] })
      .then(({ data }) => setCourses(data || []))
      .catch(() => {});

    // Load user email
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email);
    });

    // Load saved theme
    const saved = localStorage.getItem('beacon-theme') as Theme | null;
    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    if (t === 'system') {
      // Let prefers-color-scheme handle it
      return;
    }
    root.classList.add(t);
  };

  const cycleTheme = () => {
    const order: Theme[] = ['system', 'light', 'dark'];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
    localStorage.setItem('beacon-theme', next);
    applyTheme(next);
  };

  const themeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  const ThemeIcon = themeIcon;

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  const userInitials = userEmail
    ? userEmail.split('@')[0].slice(0, 2).toUpperCase()
    : '??';

  const sidebarContent = (
    <>
      <div className="p-6 flex items-center justify-between">
        <Link href="/dashboard" className="text-lg font-mono font-medium hover:opacity-70 transition-opacity">
          [beacon]
        </Link>
        <button onClick={() => setMobileOpen(false)} className="md:hidden p-1 text-muted-foreground">
          <X className="w-5 h-5" />
        </button>
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
            <p className={`px-3 text-xs font-mono uppercase tracking-wider mb-2 ${
              pathname.startsWith('/course/') ? 'text-foreground' : 'text-muted-foreground'
            }`}>Courses</p>
            {courses.map((course) => {
              const isActive = pathname === `/course/${course.id}`;
              const shortName = getShortName(course.name);
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

      {/* Footer: user + theme + sign out */}
      <div className="p-4 border-t border-border/40 space-y-2">
        {/* User profile */}
        {userEmail && (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center text-xs font-medium shrink-0">
              {userInitials}
            </div>
            <span className="text-xs text-muted-foreground truncate">{userEmail}</span>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={cycleTheme}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors w-full"
          title={`Theme: ${theme}`}
        >
          <ThemeIcon className="w-4 h-4" />
          <span className="capitalize">{theme}</span>
        </button>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 h-screen bg-background border-r border-border/40 flex-col shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-background/80 backdrop-blur-sm border-b border-border/40 flex items-center justify-between px-4">
        <Link href="/dashboard" className="text-base font-mono font-medium">
          [beacon]
        </Link>
        <button onClick={() => setMobileOpen(true)} className="p-2 text-muted-foreground hover:text-foreground">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile bottom tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-t border-border/40">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-4 py-1 ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile slide-out overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 z-[60] bg-background/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="md:hidden fixed left-0 top-0 bottom-0 z-[70] w-72 bg-background border-r border-border/40 flex flex-col"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
