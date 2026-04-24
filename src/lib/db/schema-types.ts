// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

// Inferred row types from the Drizzle schema. Use these instead of the
// legacy /src/types/index.ts shapes (which mirror the old Supabase output).

import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import * as s from './schema';

export type User = InferSelectModel<typeof s.users>;
export type NewUser = InferInsertModel<typeof s.users>;

export type Session = InferSelectModel<typeof s.sessions>;

export type Course = InferSelectModel<typeof s.courses>;
export type NewCourse = InferInsertModel<typeof s.courses>;

export type Assignment = InferSelectModel<typeof s.assignments>;
export type NewAssignment = InferInsertModel<typeof s.assignments>;

export type ContentModule = InferSelectModel<typeof s.contentModules>;
export type NewContentModule = InferInsertModel<typeof s.contentModules>;

export type ContentTopic = InferSelectModel<typeof s.contentTopics>;
export type NewContentTopic = InferInsertModel<typeof s.contentTopics>;

export type Announcement = InferSelectModel<typeof s.announcements>;
export type NewAnnouncement = InferInsertModel<typeof s.announcements>;

export type Briefing = InferSelectModel<typeof s.briefings>;
export type NewBriefing = InferInsertModel<typeof s.briefings>;

export type ChatMessage = InferSelectModel<typeof s.chatMessages>;
export type NewChatMessage = InferInsertModel<typeof s.chatMessages>;
