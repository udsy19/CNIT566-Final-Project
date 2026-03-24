-- Add course_id column to chat_messages table to scope messages per course
-- NULL course_id = global Ask Beacon chat
-- Non-null course_id = course-specific AI chat

ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE;

-- Index for efficient course-scoped queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_course_id ON chat_messages(course_id);

-- Index for global chat queries (where course_id IS NULL)
CREATE INDEX IF NOT EXISTS idx_chat_messages_global ON chat_messages(user_id, created_at)
WHERE course_id IS NULL;
