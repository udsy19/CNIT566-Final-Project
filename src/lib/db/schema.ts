// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import { sqliteTable, text, integer, real, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

const uuid = (name: string) => text(name).$defaultFn(() => randomUUID());
const now = (name: string) =>
  integer(name, { mode: 'timestamp_ms' }).$defaultFn(() => new Date());

// ─── users ───
// Extends local auth with Brightspace tokens + sync state.
// In the local app, `id` is the Lucia user id (no FK to Supabase auth).
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),

  brightspaceUserId: text('brightspace_user_id'),
  brightspaceAccessToken: text('brightspace_access_token'),
  brightspaceRefreshToken: text('brightspace_refresh_token'),
  brightspaceTokenExpiresAt: integer('brightspace_token_expires_at', { mode: 'timestamp_ms' }),

  syncStatus: text('sync_status').notNull().default('idle'),
  syncProgress: text('sync_progress', { mode: 'json' }),
  lastSyncedAt: integer('last_synced_at', { mode: 'timestamp_ms' }),

  createdAt: now('created_at').notNull(),
  updatedAt: now('updated_at').notNull(),
});

// ─── sessions (Lucia) ───
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
});

// ─── courses ───
export const courses = sqliteTable(
  'courses',
  {
    id: uuid('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    brightspaceOrgUnitId: integer('brightspace_org_unit_id').notNull(),
    name: text('name').notNull(),
    code: text('code'),
    startDate: integer('start_date', { mode: 'timestamp_ms' }),
    endDate: integer('end_date', { mode: 'timestamp_ms' }),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    currentGrade: real('current_grade'),
    finalGradePoints: real('final_grade_points'),
    finalGradeDenominator: real('final_grade_denominator'),
    createdAt: now('created_at').notNull(),
    updatedAt: now('updated_at').notNull(),
  },
  (t) => [
    uniqueIndex('courses_user_org_unit_unique').on(t.userId, t.brightspaceOrgUnitId),
    index('idx_courses_user_id').on(t.userId),
  ],
);

// ─── assignments ───
export const assignments = sqliteTable(
  'assignments',
  {
    id: uuid('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    brightspaceId: integer('brightspace_id').notNull(),
    type: text('type', { enum: ['dropbox', 'quiz'] }).notNull(),
    name: text('name').notNull(),
    instructions: text('instructions'),
    dueDate: integer('due_date', { mode: 'timestamp_ms' }),
    endDate: integer('end_date', { mode: 'timestamp_ms' }),
    pointsNumerator: real('points_numerator'),
    pointsDenominator: real('points_denominator'),
    weight: real('weight'),
    isCompleted: integer('is_completed', { mode: 'boolean' }).notNull().default(false),
    createdAt: now('created_at').notNull(),
    updatedAt: now('updated_at').notNull(),
  },
  (t) => [
    uniqueIndex('assignments_unique').on(t.userId, t.courseId, t.brightspaceId, t.type),
    index('idx_assignments_user_due_date').on(t.userId, t.dueDate),
  ],
);

// ─── content_modules ───
export const contentModules = sqliteTable(
  'content_modules',
  {
    id: uuid('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    brightspaceModuleId: integer('brightspace_module_id').notNull(),
    parentModuleId: integer('parent_module_id'),
    title: text('title').notNull(),
    description: text('description'),
    sortOrder: integer('sort_order'),
    createdAt: now('created_at').notNull(),
  },
  (t) => [
    uniqueIndex('content_modules_unique').on(t.userId, t.courseId, t.brightspaceModuleId),
  ],
);

// ─── content_topics ───
export const contentTopics = sqliteTable(
  'content_topics',
  {
    id: uuid('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    moduleId: text('module_id')
      .notNull()
      .references(() => contentModules.id, { onDelete: 'cascade' }),
    brightspaceTopicId: integer('brightspace_topic_id').notNull(),
    title: text('title').notNull(),
    url: text('url'),
    typeIdentifier: text('type_identifier'),
    sortOrder: integer('sort_order'),
    createdAt: now('created_at').notNull(),
  },
  (t) => [
    uniqueIndex('content_topics_unique').on(t.userId, t.courseId, t.brightspaceTopicId),
  ],
);

// ─── announcements ───
export const announcements = sqliteTable(
  'announcements',
  {
    id: uuid('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    brightspaceId: integer('brightspace_id').notNull(),
    title: text('title').notNull(),
    body: text('body'),
    createdDate: integer('created_date', { mode: 'timestamp_ms' }),
    isGlobal: integer('is_global', { mode: 'boolean' }).notNull().default(false),
    createdAt: now('created_at').notNull(),
  },
  (t) => [
    uniqueIndex('announcements_unique').on(t.userId, t.courseId, t.brightspaceId),
    index('idx_announcements_user_created').on(t.userId, t.createdDate),
  ],
);

// ─── briefings ───
export const briefings = sqliteTable(
  'briefings',
  {
    id: uuid('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    briefingDate: text('briefing_date').notNull(), // YYYY-MM-DD
    content: text('content').notNull(),
    generatedAt: now('generated_at').notNull(),
    createdAt: now('created_at').notNull(),
  },
  (t) => [uniqueIndex('briefings_user_date_unique').on(t.userId, t.briefingDate)],
);

// ─── chat_messages ───
// NULL course_id = global Ask Beacon chat
// Non-null course_id = course-scoped chat
export const chatMessages = sqliteTable(
  'chat_messages',
  {
    id: uuid('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: text('course_id').references(() => courses.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['user', 'assistant'] }).notNull(),
    content: text('content').notNull(),
    createdAt: now('created_at').notNull(),
  },
  (t) => [
    index('idx_chat_messages_user_created').on(t.userId, t.createdAt),
    index('idx_chat_messages_course_id').on(t.courseId),
  ],
);

// ─── relations (for Drizzle's `with` queries) ───
export const coursesRelations = relations(courses, ({ one, many }) => ({
  user: one(users, { fields: [courses.userId], references: [users.id] }),
  assignments: many(assignments),
  announcements: many(announcements),
  contentModules: many(contentModules),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  course: one(courses, { fields: [assignments.courseId], references: [courses.id] }),
  user: one(users, { fields: [assignments.userId], references: [users.id] }),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  course: one(courses, { fields: [announcements.courseId], references: [courses.id] }),
  user: one(users, { fields: [announcements.userId], references: [users.id] }),
}));

export const contentModulesRelations = relations(contentModules, ({ one, many }) => ({
  course: one(courses, { fields: [contentModules.courseId], references: [courses.id] }),
  topics: many(contentTopics),
}));

export const contentTopicsRelations = relations(contentTopics, ({ one }) => ({
  module: one(contentModules, {
    fields: [contentTopics.moduleId],
    references: [contentModules.id],
  }),
  course: one(courses, { fields: [contentTopics.courseId], references: [courses.id] }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  course: one(courses, { fields: [chatMessages.courseId], references: [courses.id] }),
  user: one(users, { fields: [chatMessages.userId], references: [users.id] }),
}));

// Silence unused sql import — kept available for future raw SQL helpers.
void sql;
