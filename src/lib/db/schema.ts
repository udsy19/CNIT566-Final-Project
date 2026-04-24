// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

// Drizzle schema for the local SQLite database.
//
// IMPORTANT: JS property names use snake_case to match the SQL column names
// exactly — this keeps result objects shape-compatible with the old Supabase
// responses (e.g. `row.user_id`, `row.created_at`) so API routes, components,
// and the existing TS types in `src/types/index.ts` all work unchanged.

import { sqliteTable, text, integer, real, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

const uuid = () => text().$defaultFn(() => randomUUID());
const timestamp = () =>
  integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date());

// ─── users ───
// In the local app, `id` is a self-generated UUID (no Supabase auth FK).
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),

  brightspace_user_id: text('brightspace_user_id'),
  brightspace_access_token: text('brightspace_access_token'),
  brightspace_refresh_token: text('brightspace_refresh_token'),
  brightspace_token_expires_at: integer('brightspace_token_expires_at', { mode: 'timestamp_ms' }),

  sync_status: text('sync_status').notNull().default('idle'),
  sync_progress: text('sync_progress', { mode: 'json' }),
  last_synced_at: integer('last_synced_at', { mode: 'timestamp_ms' }),

  created_at: timestamp().notNull(),
  updated_at: timestamp().notNull(),
});

// ─── sessions (session cookie auth) ───
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  user_id: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires_at: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
});

// ─── courses ───
export const courses = sqliteTable(
  'courses',
  {
    id: uuid().primaryKey(),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    brightspace_org_unit_id: integer('brightspace_org_unit_id').notNull(),
    name: text('name').notNull(),
    code: text('code'),
    start_date: integer('start_date', { mode: 'timestamp_ms' }),
    end_date: integer('end_date', { mode: 'timestamp_ms' }),
    is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    current_grade: real('current_grade'),
    final_grade_points: real('final_grade_points'),
    final_grade_denominator: real('final_grade_denominator'),
    created_at: timestamp().notNull(),
    updated_at: timestamp().notNull(),
  },
  (t) => [
    uniqueIndex('courses_user_org_unit_unique').on(t.user_id, t.brightspace_org_unit_id),
    index('idx_courses_user_id').on(t.user_id),
  ],
);

// ─── assignments ───
export const assignments = sqliteTable(
  'assignments',
  {
    id: uuid().primaryKey(),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    course_id: text('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    brightspace_id: integer('brightspace_id').notNull(),
    type: text('type', { enum: ['dropbox', 'quiz'] }).notNull(),
    name: text('name').notNull(),
    instructions: text('instructions'),
    due_date: integer('due_date', { mode: 'timestamp_ms' }),
    end_date: integer('end_date', { mode: 'timestamp_ms' }),
    points_numerator: real('points_numerator'),
    points_denominator: real('points_denominator'),
    weight: real('weight'),
    is_completed: integer('is_completed', { mode: 'boolean' }).notNull().default(false),
    created_at: timestamp().notNull(),
    updated_at: timestamp().notNull(),
  },
  (t) => [
    uniqueIndex('assignments_unique').on(t.user_id, t.course_id, t.brightspace_id, t.type),
    index('idx_assignments_user_due_date').on(t.user_id, t.due_date),
  ],
);

// ─── content_modules ───
export const content_modules = sqliteTable(
  'content_modules',
  {
    id: uuid().primaryKey(),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    course_id: text('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    brightspace_module_id: integer('brightspace_module_id').notNull(),
    parent_module_id: integer('parent_module_id'),
    title: text('title').notNull(),
    description: text('description'),
    sort_order: integer('sort_order'),
    created_at: timestamp().notNull(),
  },
  (t) => [
    uniqueIndex('content_modules_unique').on(t.user_id, t.course_id, t.brightspace_module_id),
  ],
);

// ─── content_topics ───
export const content_topics = sqliteTable(
  'content_topics',
  {
    id: uuid().primaryKey(),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    course_id: text('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    module_id: text('module_id')
      .notNull()
      .references(() => content_modules.id, { onDelete: 'cascade' }),
    brightspace_topic_id: integer('brightspace_topic_id').notNull(),
    title: text('title').notNull(),
    url: text('url'),
    type_identifier: text('type_identifier'),
    sort_order: integer('sort_order'),
    created_at: timestamp().notNull(),
  },
  (t) => [
    uniqueIndex('content_topics_unique').on(t.user_id, t.course_id, t.brightspace_topic_id),
  ],
);

// ─── announcements ───
export const announcements = sqliteTable(
  'announcements',
  {
    id: uuid().primaryKey(),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    course_id: text('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    brightspace_id: integer('brightspace_id').notNull(),
    title: text('title').notNull(),
    body: text('body'),
    created_date: integer('created_date', { mode: 'timestamp_ms' }),
    is_global: integer('is_global', { mode: 'boolean' }).notNull().default(false),
    created_at: timestamp().notNull(),
  },
  (t) => [
    uniqueIndex('announcements_unique').on(t.user_id, t.course_id, t.brightspace_id),
    index('idx_announcements_user_created').on(t.user_id, t.created_date),
  ],
);

// ─── briefings ───
export const briefings = sqliteTable(
  'briefings',
  {
    id: uuid().primaryKey(),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    briefing_date: text('briefing_date').notNull(), // YYYY-MM-DD
    content: text('content').notNull(),
    generated_at: timestamp().notNull(),
    created_at: timestamp().notNull(),
  },
  (t) => [uniqueIndex('briefings_user_date_unique').on(t.user_id, t.briefing_date)],
);

// ─── chat_messages ───
// NULL course_id = global Ask Beacon chat
// Non-null course_id = course-scoped chat
export const chat_messages = sqliteTable(
  'chat_messages',
  {
    id: uuid().primaryKey(),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    course_id: text('course_id').references(() => courses.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['user', 'assistant'] }).notNull(),
    content: text('content').notNull(),
    created_at: timestamp().notNull(),
  },
  (t) => [
    index('idx_chat_messages_user_created').on(t.user_id, t.created_at),
    index('idx_chat_messages_course_id').on(t.course_id),
  ],
);

// ─── relations ───
export const coursesRelations = relations(courses, ({ one, many }) => ({
  user: one(users, { fields: [courses.user_id], references: [users.id] }),
  assignments: many(assignments),
  announcements: many(announcements),
  content_modules: many(content_modules),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  course: one(courses, { fields: [assignments.course_id], references: [courses.id] }),
  user: one(users, { fields: [assignments.user_id], references: [users.id] }),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  course: one(courses, { fields: [announcements.course_id], references: [courses.id] }),
  user: one(users, { fields: [announcements.user_id], references: [users.id] }),
}));

export const contentModulesRelations = relations(content_modules, ({ one, many }) => ({
  course: one(courses, { fields: [content_modules.course_id], references: [courses.id] }),
  topics: many(content_topics),
}));

export const contentTopicsRelations = relations(content_topics, ({ one }) => ({
  module: one(content_modules, {
    fields: [content_topics.module_id],
    references: [content_modules.id],
  }),
  course: one(courses, { fields: [content_topics.course_id], references: [courses.id] }),
}));

export const chatMessagesRelations = relations(chat_messages, ({ one }) => ({
  course: one(courses, { fields: [chat_messages.course_id], references: [courses.id] }),
  user: one(users, { fields: [chat_messages.user_id], references: [users.id] }),
}));

void sql;
