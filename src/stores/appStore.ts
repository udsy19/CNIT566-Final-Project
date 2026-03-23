import { create } from 'zustand';
import type { Course, User } from '@/types';

interface AppState {
  user: User | null;
  courses: Course[];
  sidebarOpen: boolean;
  setUser: (user: User | null) => void;
  setCourses: (courses: Course[]) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  courses: [],
  sidebarOpen: true,
  setUser: (user) => set({ user }),
  setCourses: (courses) => set({ courses }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
