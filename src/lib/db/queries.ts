// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

// Domain-specific query helpers. Use these from API routes instead of
// touching Drizzle directly — keeps route handlers short and consistent.

import { eq, and, or, asc, desc, gte, lte, isNull, inArray, sql } from 'drizzle-orm';
import { db } from './client';
import {
  users,
  courses,
  assignments,
  content_modules,
  content_topics,
  announcements,
  briefings,
  chat_messages,
} from './schema';
import type { NewUser, NewCourse, NewAssignment, NewAnnouncement } from './schema-types';

// ─── Users ───
export const Users = {
  findByEmail(email: string) {
    return db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
  },
  findById(id: string) {
    return db.select().from(users).where(eq(users.id, id)).get();
  },
  create(row: NewUser) {
    db.insert(users).values(row).run();
    return this.findById(row.id)!;
  },
  updateSyncStatus(
    id: string,
    patch: Partial<{
      sync_status: string;
      sync_progress: unknown;
      last_synced_at: Date;
    }>,
  ) {
    db.update(users)
      .set({ ...patch, updated_at: new Date() })
      .where(eq(users.id, id))
      .run();
  },
  updateBrightspaceTokens(
    id: string,
    tokens: {
      brightspace_user_id?: string | null;
      brightspace_access_token?: string | null;
      brightspace_refresh_token?: string | null;
      brightspace_token_expires_at?: Date | null;
    },
  ) {
    db.update(users)
      .set({ ...tokens, updated_at: new Date() })
      .where(eq(users.id, id))
      .run();
  },
  clearBrightspace(id: string) {
    db.update(users)
      .set({
        brightspace_user_id: null,
        brightspace_access_token: null,
        brightspace_refresh_token: null,
        brightspace_token_expires_at: null,
        updated_at: new Date(),
      })
      .where(eq(users.id, id))
      .run();
  },
};

// ─── Courses ───
export const Courses = {
  list(userId: string, opts?: { activeOnly?: boolean }) {
    const filter = opts?.activeOnly
      ? and(eq(courses.user_id, userId), eq(courses.is_active, true))
      : eq(courses.user_id, userId);
    return db.select().from(courses).where(filter).orderBy(asc(courses.name)).all();
  },
  findById(id: string, userId: string) {
    return db
      .select()
      .from(courses)
      .where(and(eq(courses.id, id), eq(courses.user_id, userId)))
      .get();
  },
  upsert(row: NewCourse) {
    return db
      .insert(courses)
      .values(row)
      .onConflictDoUpdate({
        target: [courses.user_id, courses.brightspace_org_unit_id],
        set: {
          name: row.name,
          code: row.code ?? null,
          start_date: row.start_date ?? null,
          end_date: row.end_date ?? null,
          is_active: row.is_active ?? true,
          current_grade: row.current_grade ?? null,
          final_grade_points: row.final_grade_points ?? null,
          final_grade_denominator: row.final_grade_denominator ?? null,
          updated_at: new Date(),
        },
      })
      .returning()
      .get();
  },
  updateGrade(id: string, userId: string, grade: number) {
    db.update(courses)
      .set({ current_grade: grade, updated_at: new Date() })
      .where(and(eq(courses.id, id), eq(courses.user_id, userId)))
      .run();
  },
  deleteAllForUser(userId: string) {
    db.delete(courses).where(eq(courses.user_id, userId)).run();
  },
};

// ─── Assignments ───
export const Assignments = {
  listForUser(userId: string) {
    return db
      .select()
      .from(assignments)
      .where(eq(assignments.user_id, userId))
      .orderBy(asc(assignments.due_date))
      .all();
  },
  listForCourse(userId: string, courseId: string) {
    return db
      .select()
      .from(assignments)
      .where(and(eq(assignments.user_id, userId), eq(assignments.course_id, courseId)))
      .orderBy(asc(assignments.due_date))
      .all();
  },
  listUpcoming(userId: string, windowDays = 7) {
    const now = new Date();
    const until = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000);
    return db
      .select()
      .from(assignments)
      .where(
        and(
          eq(assignments.user_id, userId),
          gte(assignments.due_date, now),
          lte(assignments.due_date, until),
        ),
      )
      .orderBy(asc(assignments.due_date))
      .all();
  },
  findById(id: string, userId: string) {
    return db
      .select()
      .from(assignments)
      .where(and(eq(assignments.id, id), eq(assignments.user_id, userId)))
      .get();
  },
  upsert(row: NewAssignment) {
    return db
      .insert(assignments)
      .values(row)
      .onConflictDoUpdate({
        target: [
          assignments.user_id,
          assignments.course_id,
          assignments.brightspace_id,
          assignments.type,
        ],
        set: {
          name: row.name,
          instructions: row.instructions ?? null,
          due_date: row.due_date ?? null,
          end_date: row.end_date ?? null,
          points_numerator: row.points_numerator ?? null,
          points_denominator: row.points_denominator ?? null,
          weight: row.weight ?? null,
          updated_at: new Date(),
        },
      })
      .returning()
      .get();
  },
  setCompleted(id: string, userId: string, isCompleted: boolean) {
    db.update(assignments)
      .set({ is_completed: isCompleted, updated_at: new Date() })
      .where(and(eq(assignments.id, id), eq(assignments.user_id, userId)))
      .run();
  },
};

// ─── Announcements ───
export const Announcements = {
  listForUser(userId: string, limit = 20) {
    return db
      .select()
      .from(announcements)
      .where(eq(announcements.user_id, userId))
      .orderBy(desc(announcements.created_date))
      .limit(limit)
      .all();
  },
  listForCourse(userId: string, courseId: string, limit = 50) {
    return db
      .select()
      .from(announcements)
      .where(and(eq(announcements.user_id, userId), eq(announcements.course_id, courseId)))
      .orderBy(desc(announcements.created_date))
      .limit(limit)
      .all();
  },
  upsert(row: NewAnnouncement) {
    return db
      .insert(announcements)
      .values(row)
      .onConflictDoUpdate({
        target: [
          announcements.user_id,
          announcements.course_id,
          announcements.brightspace_id,
        ],
        set: {
          title: row.title,
          body: row.body ?? null,
          created_date: row.created_date ?? null,
          is_global: row.is_global ?? false,
        },
      })
      .returning()
      .get();
  },
};

// ─── Content ───
export const Content = {
  listModules(userId: string, courseId: string) {
    return db
      .select()
      .from(content_modules)
      .where(and(eq(content_modules.user_id, userId), eq(content_modules.course_id, courseId)))
      .orderBy(asc(content_modules.sort_order))
      .all();
  },
  listTopics(userId: string, courseId: string) {
    return db
      .select()
      .from(content_topics)
      .where(and(eq(content_topics.user_id, userId), eq(content_topics.course_id, courseId)))
      .orderBy(asc(content_topics.sort_order))
      .all();
  },
  listTopicsByTitles(userId: string, courseId: string, titlePatterns: string[]) {
    const likeExpr = titlePatterns.map(
      (pattern) => sql`lower(${content_topics.title}) LIKE ${`%${pattern.toLowerCase()}%`}`,
    );
    return db
      .select()
      .from(content_topics)
      .where(
        and(
          eq(content_topics.user_id, userId),
          eq(content_topics.course_id, courseId),
          or(...likeExpr),
        ),
      )
      .limit(5)
      .all();
  },
  upsertModule(row: typeof content_modules.$inferInsert) {
    return db
      .insert(content_modules)
      .values(row)
      .onConflictDoUpdate({
        target: [
          content_modules.user_id,
          content_modules.course_id,
          content_modules.brightspace_module_id,
        ],
        set: {
          title: row.title,
          description: row.description ?? null,
          parent_module_id: row.parent_module_id ?? null,
          sort_order: row.sort_order ?? null,
        },
      })
      .returning()
      .get();
  },
  upsertTopic(row: typeof content_topics.$inferInsert) {
    return db
      .insert(content_topics)
      .values(row)
      .onConflictDoUpdate({
        target: [
          content_topics.user_id,
          content_topics.course_id,
          content_topics.brightspace_topic_id,
        ],
        set: {
          title: row.title,
          url: row.url ?? null,
          type_identifier: row.type_identifier ?? null,
          sort_order: row.sort_order ?? null,
        },
      })
      .returning()
      .get();
  },
};

// ─── Briefings ───
export const Briefings = {
  findForDate(userId: string, date: string) {
    return db
      .select()
      .from(briefings)
      .where(and(eq(briefings.user_id, userId), eq(briefings.briefing_date, date)))
      .get();
  },
  upsert(userId: string, date: string, content: string) {
    return db
      .insert(briefings)
      .values({ user_id: userId, briefing_date: date, content })
      .onConflictDoUpdate({
        target: [briefings.user_id, briefings.briefing_date],
        set: { content, generated_at: new Date() },
      })
      .returning()
      .get();
  },
};

// ─── Chat ───
export const Chat = {
  listGlobal(userId: string, limit = 50) {
    return db
      .select()
      .from(chat_messages)
      .where(and(eq(chat_messages.user_id, userId), isNull(chat_messages.course_id)))
      .orderBy(asc(chat_messages.created_at))
      .limit(limit)
      .all();
  },
  listForCourse(userId: string, courseId: string, limit = 50) {
    return db
      .select()
      .from(chat_messages)
      .where(and(eq(chat_messages.user_id, userId), eq(chat_messages.course_id, courseId)))
      .orderBy(asc(chat_messages.created_at))
      .limit(limit)
      .all();
  },
  insert(row: {
    user_id: string;
    course_id?: string | null;
    role: 'user' | 'assistant';
    content: string;
  }) {
    db.insert(chat_messages)
      .values({
        user_id: row.user_id,
        course_id: row.course_id ?? null,
        role: row.role,
        content: row.content,
      })
      .run();
  },
  getRecentHistory(userId: string, courseId: string | null, limit = 10) {
    const scope = courseId
      ? eq(chat_messages.course_id, courseId)
      : isNull(chat_messages.course_id);
    return db
      .select()
      .from(chat_messages)
      .where(and(eq(chat_messages.user_id, userId), scope))
      .orderBy(desc(chat_messages.created_at))
      .limit(limit)
      .all()
      .reverse();
  },
};

void inArray;
