// Database row types
export interface User {
  id: string;
  email: string;
  brightspace_user_id: string | null;
  brightspace_access_token: string | null;
  brightspace_refresh_token: string | null;
  brightspace_token_expires_at: string | null;
  sync_status: 'idle' | 'syncing' | 'completed' | 'error';
  sync_progress: SyncProgress | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SyncProgress {
  current_step: string;
  total_courses: number;
  completed_courses: number;
  error_message?: string;
}

export interface Course {
  id: string;
  user_id: string;
  brightspace_org_unit_id: number;
  name: string;
  code: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  current_grade: number | null;
  final_grade_points: number | null;
  final_grade_denominator: number | null;
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: string;
  user_id: string;
  course_id: string;
  brightspace_id: number;
  type: 'dropbox' | 'quiz';
  name: string;
  instructions: string | null;
  due_date: string | null;
  end_date: string | null;
  points_numerator: number | null;
  points_denominator: number | null;
  weight: number | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  course?: Course;
}

export interface ContentModule {
  id: string;
  user_id: string;
  course_id: string;
  brightspace_module_id: number;
  parent_module_id: number | null;
  title: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface ContentTopic {
  id: string;
  user_id: string;
  course_id: string;
  module_id: string;
  brightspace_topic_id: number;
  title: string;
  url: string | null;
  type_identifier: string | null;
  sort_order: number;
  created_at: string;
}

export interface Announcement {
  id: string;
  user_id: string;
  course_id: string;
  brightspace_id: number;
  title: string;
  body: string | null;
  created_date: string;
  is_global: boolean;
  created_at: string;
  course?: Course;
}

export interface Briefing {
  id: string;
  user_id: string;
  briefing_date: string;
  content: string;
  generated_at: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface CourseWithCounts extends Course {
  assignment_count: number;
  upcoming_count: number;
  announcement_count: number;
}

export interface DashboardData {
  courses: CourseWithCounts[];
  upcoming_assignments: (Assignment & { course: Course })[];
  recent_announcements: (Announcement & { course: Course })[];
  briefing: Briefing | null;
}
