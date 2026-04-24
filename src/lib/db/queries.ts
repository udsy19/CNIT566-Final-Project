// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

// Domain-specific query helpers. Use these from API routes instead of
// touching Drizzle directly — keeps route handlers short and consistent,
// and concentrates all data access in one place.

import { eq, and, or, asc, desc, gte, lte, isNull, isNotNull, inArray, sql } from 'drizzle-orm';
import { db } from './client';
import {
  users,
  courses,
  assignments,
  contentModules,
  contentTopics,
  announcements,
  briefings,
  chatMessages,
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
      syncStatus: string;
      syncProgress: unknown;
      lastSyncedAt: Date;
    }>,
  ) {
    db.update(users)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(users.id, id))
      .run();
  },
  updateBrightspaceTokens(
    id: string,
    tokens: {
      brightspaceUserId?: string | null;
      brightspaceAccessToken?: string | null;
      brightspaceRefreshToken?: string | null;
      brightspaceTokenExpiresAt?: Date | null;
    },
  ) {
    db.update(users)
      .set({ ...tokens, updatedAt: new Date() })
      .where(eq(users.id, id))
      .run();
  },
  clearBrightspace(id: string) {
    db.update(users)
      .set({
        brightspaceUserId: null,
        brightspaceAccessToken: null,
        brightspaceRefreshToken: null,
        brightspaceTokenExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .run();
  },
};

// ─── Courses ───
export const Courses = {
  list(userId: string, opts?: { activeOnly?: boolean }) {
    const filter = opts?.activeOnly
      ? and(eq(courses.userId, userId), eq(courses.isActive, true))
      : eq(courses.userId, userId);
    return db.select().from(courses).where(filter).orderBy(asc(courses.name)).all();
  },
  findById(id: string, userId: string) {
    return db
      .select()
      .from(courses)
      .where(and(eq(courses.id, id), eq(courses.userId, userId)))
      .get();
  },
  upsert(row: NewCourse) {
    return db
      .insert(courses)
      .values(row)
      .onConflictDoUpdate({
        target: [courses.userId, courses.brightspaceOrgUnitId],
        set: {
          name: row.name,
          code: row.code ?? null,
          startDate: row.startDate ?? null,
          endDate: row.endDate ?? null,
          isActive: row.isActive ?? true,
          currentGrade: row.currentGrade ?? null,
          finalGradePoints: row.finalGradePoints ?? null,
          finalGradeDenominator: row.finalGradeDenominator ?? null,
          updatedAt: new Date(),
        },
      })
      .returning()
      .get();
  },
  updateGrade(id: string, userId: string, grade: number) {
    db.update(courses)
      .set({ currentGrade: grade, updatedAt: new Date() })
      .where(and(eq(courses.id, id), eq(courses.userId, userId)))
      .run();
  },
  deleteAllForUser(userId: string) {
    db.delete(courses).where(eq(courses.userId, userId)).run();
  },
};

// ─── Assignments ───
export const Assignments = {
  listForUser(userId: string) {
    return db
      .select()
      .from(assignments)
      .where(eq(assignments.userId, userId))
      .orderBy(asc(assignments.dueDate))
      .all();
  },
  listForCourse(userId: string, courseId: string) {
    return db
      .select()
      .from(assignments)
      .where(and(eq(assignments.userId, userId), eq(assignments.courseId, courseId)))
      .orderBy(asc(assignments.dueDate))
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
          eq(assignments.userId, userId),
          gte(assignments.dueDate, now),
          lte(assignments.dueDate, until),
        ),
      )
      .orderBy(asc(assignments.dueDate))
      .all();
  },
  findById(id: string, userId: string) {
    return db
      .select()
      .from(assignments)
      .where(and(eq(assignments.id, id), eq(assignments.userId, userId)))
      .get();
  },
  upsert(row: NewAssignment) {
    return db
      .insert(assignments)
      .values(row)
      .onConflictDoUpdate({
        target: [
          assignments.userId,
          assignments.courseId,
          assignments.brightspaceId,
          assignments.type,
        ],
        set: {
          name: row.name,
          instructions: row.instructions ?? null,
          dueDate: row.dueDate ?? null,
          endDate: row.endDate ?? null,
          pointsNumerator: row.pointsNumerator ?? null,
          pointsDenominator: row.pointsDenominator ?? null,
          weight: row.weight ?? null,
          updatedAt: new Date(),
        },
      })
      .returning()
      .get();
  },
  setCompleted(id: string, userId: string, isCompleted: boolean) {
    db.update(assignments)
      .set({ isCompleted, updatedAt: new Date() })
      .where(and(eq(assignments.id, id), eq(assignments.userId, userId)))
      .run();
  },
};

// ─── Announcements ───
export const Announcements = {
  listForUser(userId: string, limit = 20) {
    return db
      .select()
      .from(announcements)
      .where(eq(announcements.userId, userId))
      .orderBy(desc(announcements.createdDate))
      .limit(limit)
      .all();
  },
  listForCourse(userId: string, courseId: string, limit = 50) {
    return db
      .select()
      .from(announcements)
      .where(and(eq(announcements.userId, userId), eq(announcements.courseId, courseId)))
      .orderBy(desc(announcements.createdDate))
      .limit(limit)
      .all();
  },
  upsert(row: NewAnnouncement) {
    return db
      .insert(announcements)
      .values(row)
      .onConflictDoUpdate({
        target: [
          announcements.userId,
          announcements.courseId,
          announcements.brightspaceId,
        ],
        set: {
          title: row.title,
          body: row.body ?? null,
          createdDate: row.createdDate ?? null,
          isGlobal: row.isGlobal ?? false,
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
      .from(contentModules)
      .where(and(eq(contentModules.userId, userId), eq(contentModules.courseId, courseId)))
      .orderBy(asc(contentModules.sortOrder))
      .all();
  },
  listTopics(userId: string, courseId: string) {
    return db
      .select()
      .from(contentTopics)
      .where(and(eq(contentTopics.userId, userId), eq(contentTopics.courseId, courseId)))
      .orderBy(asc(contentTopics.sortOrder))
      .all();
  },
  listTopicsByTitles(userId: string, courseId: string, titlePatterns: string[]) {
    // OR of ILIKE-ish matches — used for syllabus detection.
    const likeExpr = titlePatterns.map(
      (pattern) => sql`lower(${contentTopics.title}) LIKE ${`%${pattern.toLowerCase()}%`}`,
    );
    return db
      .select()
      .from(contentTopics)
      .where(
        and(
          eq(contentTopics.userId, userId),
          eq(contentTopics.courseId, courseId),
          or(...likeExpr),
        ),
      )
      .limit(5)
      .all();
  },
  upsertModule(row: typeof contentModules.$inferInsert) {
    return db
      .insert(contentModules)
      .values(row)
      .onConflictDoUpdate({
        target: [
          contentModules.userId,
          contentModules.courseId,
          contentModules.brightspaceModuleId,
        ],
        set: {
          title: row.title,
          description: row.description ?? null,
          parentModuleId: row.parentModuleId ?? null,
          sortOrder: row.sortOrder ?? null,
        },
      })
      .returning()
      .get();
  },
  upsertTopic(row: typeof contentTopics.$inferInsert) {
    return db
      .insert(contentTopics)
      .values(row)
      .onConflictDoUpdate({
        target: [
          contentTopics.userId,
          contentTopics.courseId,
          contentTopics.brightspaceTopicId,
        ],
        set: {
          title: row.title,
          url: row.url ?? null,
          typeIdentifier: row.typeIdentifier ?? null,
          sortOrder: row.sortOrder ?? null,
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
      .where(and(eq(briefings.userId, userId), eq(briefings.briefingDate, date)))
      .get();
  },
  upsert(userId: string, date: string, content: string) {
    return db
      .insert(briefings)
      .values({ userId, briefingDate: date, content })
      .onConflictDoUpdate({
        target: [briefings.userId, briefings.briefingDate],
        set: { content, generatedAt: new Date() },
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
      .from(chatMessages)
      .where(and(eq(chatMessages.userId, userId), isNull(chatMessages.courseId)))
      .orderBy(asc(chatMessages.createdAt))
      .limit(limit)
      .all();
  },
  listForCourse(userId: string, courseId: string, limit = 50) {
    return db
      .select()
      .from(chatMessages)
      .where(and(eq(chatMessages.userId, userId), eq(chatMessages.courseId, courseId)))
      .orderBy(asc(chatMessages.createdAt))
      .limit(limit)
      .all();
  },
  insert(row: {
    userId: string;
    courseId?: string | null;
    role: 'user' | 'assistant';
    content: string;
  }) {
    db.insert(chatMessages)
      .values({
        userId: row.userId,
        courseId: row.courseId ?? null,
        role: row.role,
        content: row.content,
      })
      .run();
  },
  getRecentHistory(userId: string, courseId: string | null, limit = 10) {
    const scope = courseId
      ? eq(chatMessages.courseId, courseId)
      : isNull(chatMessages.courseId);
    return db
      .select()
      .from(chatMessages)
      .where(and(eq(chatMessages.userId, userId), scope))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit)
      .all()
      .reverse();
  },
};

// Silence unused imports we keep available for future helpers.
void isNotNull;
void inArray;
