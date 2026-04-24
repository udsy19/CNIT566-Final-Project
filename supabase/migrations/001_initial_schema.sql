-- Beacon · CNIT 566 Final Project
-- Author: Udaya Tejas

-- ============================================================================
-- Beacon: Initial Database Schema
-- AI-Powered Academic Dashboard with Brightspace LMS Integration
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Trigger function: auto-update updated_at on row modification
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. users — extends Supabase auth with Brightspace tokens and sync metadata
-- ============================================================================
CREATE TABLE users (
  id                          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                       text,
  brightspace_user_id         text,
  brightspace_access_token    text,
  brightspace_refresh_token   text,
  brightspace_token_expires_at timestamptz,
  sync_status                 text NOT NULL DEFAULT 'idle',
  sync_progress               jsonb,
  last_synced_at              timestamptz,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. courses — synced course enrollments with grades
-- ============================================================================
CREATE TABLE courses (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brightspace_org_unit_id   bigint NOT NULL,
  name                      text NOT NULL,
  code                      text,
  start_date                timestamptz,
  end_date                  timestamptz,
  is_active                 boolean NOT NULL DEFAULT true,
  current_grade             numeric,
  final_grade_points        numeric,
  final_grade_denominator   numeric,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, brightspace_org_unit_id)
);

CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. assignments — dropbox folders + quizzes with due dates and grades
-- ============================================================================
CREATE TABLE assignments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id           uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  brightspace_id      bigint NOT NULL,
  type                text NOT NULL CHECK (type IN ('dropbox', 'quiz')),
  name                text NOT NULL,
  instructions        text,
  due_date            timestamptz,
  end_date            timestamptz,
  points_numerator    numeric,
  points_denominator  numeric,
  weight              numeric,
  is_completed        boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id, brightspace_id, type)
);

CREATE TRIGGER assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. content_modules — hierarchical course content modules
-- ============================================================================
CREATE TABLE content_modules (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id               uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  brightspace_module_id   bigint NOT NULL,
  parent_module_id        bigint,
  title                   text NOT NULL,
  description             text,
  sort_order              integer,
  created_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id, brightspace_module_id)
);

-- ============================================================================
-- 5. content_topics — individual content items within modules
-- ============================================================================
CREATE TABLE content_topics (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id               uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id               uuid NOT NULL REFERENCES content_modules(id) ON DELETE CASCADE,
  brightspace_topic_id    bigint NOT NULL,
  title                   text NOT NULL,
  url                     text,
  type_identifier         text,
  sort_order              integer,
  created_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id, brightspace_topic_id)
);

-- ============================================================================
-- 6. announcements — course news
-- ============================================================================
CREATE TABLE announcements (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id         uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  brightspace_id    bigint NOT NULL,
  title             text NOT NULL,
  body              text,
  created_date      timestamptz,
  is_global         boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id, brightspace_id)
);

-- ============================================================================
-- 7. briefings — cached AI daily briefings
-- ============================================================================
CREATE TABLE briefings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  briefing_date   date NOT NULL,
  content         text NOT NULL,
  generated_at    timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, briefing_date)
);

-- ============================================================================
-- 8. chat_messages — Ask Beacon conversation history
-- ============================================================================
CREATE TABLE chat_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('user', 'assistant')),
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX idx_courses_user_id ON courses(user_id);
CREATE INDEX idx_assignments_user_due_date ON assignments(user_id, due_date);
CREATE INDEX idx_announcements_user_created ON announcements(user_id, created_date DESC);
CREATE INDEX idx_chat_messages_user_created ON chat_messages(user_id, created_at);

-- ============================================================================
-- Row Level Security
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- users: id = auth.uid()
CREATE POLICY "users_select_own" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "users_delete_own" ON users FOR DELETE USING (id = auth.uid());

-- courses: user_id = auth.uid()
CREATE POLICY "courses_select_own" ON courses FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "courses_insert_own" ON courses FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "courses_update_own" ON courses FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "courses_delete_own" ON courses FOR DELETE USING (user_id = auth.uid());

-- assignments: user_id = auth.uid()
CREATE POLICY "assignments_select_own" ON assignments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "assignments_insert_own" ON assignments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "assignments_update_own" ON assignments FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "assignments_delete_own" ON assignments FOR DELETE USING (user_id = auth.uid());

-- content_modules: user_id = auth.uid()
CREATE POLICY "content_modules_select_own" ON content_modules FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "content_modules_insert_own" ON content_modules FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "content_modules_update_own" ON content_modules FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "content_modules_delete_own" ON content_modules FOR DELETE USING (user_id = auth.uid());

-- content_topics: user_id = auth.uid()
CREATE POLICY "content_topics_select_own" ON content_topics FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "content_topics_insert_own" ON content_topics FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "content_topics_update_own" ON content_topics FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "content_topics_delete_own" ON content_topics FOR DELETE USING (user_id = auth.uid());

-- announcements: user_id = auth.uid()
CREATE POLICY "announcements_select_own" ON announcements FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "announcements_insert_own" ON announcements FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "announcements_update_own" ON announcements FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "announcements_delete_own" ON announcements FOR DELETE USING (user_id = auth.uid());

-- briefings: user_id = auth.uid()
CREATE POLICY "briefings_select_own" ON briefings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "briefings_insert_own" ON briefings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "briefings_update_own" ON briefings FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "briefings_delete_own" ON briefings FOR DELETE USING (user_id = auth.uid());

-- chat_messages: user_id = auth.uid()
CREATE POLICY "chat_messages_select_own" ON chat_messages FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "chat_messages_insert_own" ON chat_messages FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "chat_messages_update_own" ON chat_messages FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "chat_messages_delete_own" ON chat_messages FOR DELETE USING (user_id = auth.uid());
