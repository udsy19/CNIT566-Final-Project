// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import { SupabaseClient } from '@supabase/supabase-js';
import { BrightspaceClient } from './client';
import { getValidToken } from './auth';
import { stripHtml } from '@/lib/utils/formatting';

export async function runFullSync(userId: string, supabase: SupabaseClient) {
  try {
    // Update status to syncing
    await supabase
      .from('users')
      .update({
        sync_status: 'syncing',
        sync_progress: { current_step: 'Starting sync...', total_courses: 0, completed_courses: 0 },
      })
      .eq('id', userId);

    const token = await getValidToken(userId);
    const client = new BrightspaceClient(token);

    // Step 1: Fetch enrollments
    await updateProgress(supabase, userId, 'Fetching enrollments...');
    const enrollments = await client.getMyEnrollments();

    const activeEnrollments = enrollments.filter((e) => e.Access.IsActive);

    await supabase
      .from('users')
      .update({
        sync_progress: {
          current_step: 'Syncing courses...',
          total_courses: activeEnrollments.length,
          completed_courses: 0,
        },
      })
      .eq('id', userId);

    // Step 2: Sync each course
    for (let i = 0; i < activeEnrollments.length; i++) {
      const enrollment = activeEnrollments[i];
      const orgUnitId = enrollment.OrgUnit.Id;

      // Upsert course
      const { data: course } = await supabase
        .from('courses')
        .upsert(
          {
            user_id: userId,
            brightspace_org_unit_id: orgUnitId,
            name: enrollment.OrgUnit.Name,
            code: enrollment.OrgUnit.Code,
            start_date: enrollment.Access.StartDate,
            end_date: enrollment.Access.EndDate,
            is_active: enrollment.Access.IsActive,
          },
          { onConflict: 'user_id,brightspace_org_unit_id' }
        )
        .select('id')
        .single();

      if (!course) continue;
      const courseId = course.id;

      // Sync assignments (dropbox + quizzes)
      await syncAssignments(client, supabase, userId, courseId, orgUnitId);

      // Sync content modules
      await syncContent(client, supabase, userId, courseId, orgUnitId);

      // Sync grades
      await syncGrades(client, supabase, userId, courseId, orgUnitId);

      // Sync announcements
      await syncAnnouncements(client, supabase, userId, courseId, orgUnitId);

      await supabase
        .from('users')
        .update({
          sync_progress: {
            current_step: `Synced ${enrollment.OrgUnit.Name}`,
            total_courses: activeEnrollments.length,
            completed_courses: i + 1,
          },
        })
        .eq('id', userId);
    }

    // Mark sync complete
    await supabase
      .from('users')
      .update({
        sync_status: 'completed',
        sync_progress: {
          current_step: 'Sync complete',
          total_courses: activeEnrollments.length,
          completed_courses: activeEnrollments.length,
        },
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', userId);
  } catch (error) {
    console.error('Sync failed:', error);
    await supabase
      .from('users')
      .update({
        sync_status: 'error',
        sync_progress: {
          current_step: 'Sync failed',
          total_courses: 0,
          completed_courses: 0,
          error_message: error instanceof Error ? error.message : 'Unknown error',
        },
      })
      .eq('id', userId);
  }
}

async function updateProgress(supabase: SupabaseClient, userId: string, step: string) {
  await supabase
    .from('users')
    .update({
      sync_progress: { current_step: step, total_courses: 0, completed_courses: 0 },
    })
    .eq('id', userId);
}

async function syncAssignments(
  client: BrightspaceClient,
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
  orgUnitId: number
) {
  try {
    // Sync dropbox folders
    const folders = await client.getDropboxFolders(orgUnitId);
    for (const folder of folders) {
      await supabase.from('assignments').upsert(
        {
          user_id: userId,
          course_id: courseId,
          brightspace_id: folder.Id,
          type: 'dropbox',
          name: folder.Name,
          instructions: folder.Instructions?.Html ? stripHtml(folder.Instructions.Html) : null,
          due_date: folder.DueDate,
          end_date: folder.EndDate,
          points_denominator: folder.Assessment?.ScoreDenominator,
          weight: folder.Assessment?.Weight,
        },
        { onConflict: 'user_id,course_id,brightspace_id,type' }
      );
    }

    // Sync quizzes
    const quizzes = await client.getQuizzes(orgUnitId);
    for (const quiz of quizzes) {
      await supabase.from('assignments').upsert(
        {
          user_id: userId,
          course_id: courseId,
          brightspace_id: quiz.QuizId,
          type: 'quiz',
          name: quiz.Name,
          instructions: quiz.Description?.Html ? stripHtml(quiz.Description.Html) : null,
          due_date: quiz.DueDate,
          end_date: quiz.EndDate,
        },
        { onConflict: 'user_id,course_id,brightspace_id,type' }
      );
    }
  } catch (error) {
    console.error(`Failed to sync assignments for course ${orgUnitId}:`, error);
  }
}

async function syncContent(
  client: BrightspaceClient,
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
  orgUnitId: number
) {
  try {
    const modules = await client.getContentRoot(orgUnitId);

    for (const mod of modules) {
      // Upsert module
      const { data: dbModule } = await supabase
        .from('content_modules')
        .upsert(
          {
            user_id: userId,
            course_id: courseId,
            brightspace_module_id: mod.Id,
            parent_module_id: mod.ParentModuleId,
            title: mod.Title,
            description: mod.Description?.Html ? stripHtml(mod.Description.Html) : null,
            sort_order: 0,
          },
          { onConflict: 'user_id,course_id,brightspace_module_id' }
        )
        .select('id')
        .single();

      if (!dbModule) continue;

      // Fetch and sync topics for this module
      try {
        const children = await client.getModuleChildren(orgUnitId, mod.Id);
        for (let i = 0; i < children.length; i++) {
          const topic = children[i];
          await supabase.from('content_topics').upsert(
            {
              user_id: userId,
              course_id: courseId,
              module_id: dbModule.id,
              brightspace_topic_id: topic.TopicId,
              title: topic.Title,
              url: topic.Url,
              type_identifier: topic.TypeIdentifier,
              sort_order: i,
            },
            { onConflict: 'user_id,course_id,brightspace_topic_id' }
          );
        }
      } catch {
        // Some modules may not have accessible children
      }
    }
  } catch (error) {
    console.error(`Failed to sync content for course ${orgUnitId}:`, error);
  }
}

async function syncGrades(
  client: BrightspaceClient,
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
  orgUnitId: number
) {
  try {
    // Sync individual grade values
    const gradeValues = await client.getMyGradeValues(orgUnitId);

    for (const grade of gradeValues) {
      // Match grade to assignment by brightspace grade object ID
      if (grade.PointsNumerator != null) {
        await supabase
          .from('assignments')
          .update({
            points_numerator: grade.PointsNumerator,
            points_denominator: grade.PointsDenominator,
          })
          .eq('course_id', courseId)
          .eq('user_id', userId)
          .eq('name', grade.GradeObjectName);
      }
    }

    // Sync final grade
    const finalGrade = await client.getFinalGrade(orgUnitId);
    if (finalGrade) {
      const currentGrade =
        finalGrade.PointsNumerator != null && finalGrade.PointsDenominator
          ? (finalGrade.PointsNumerator / finalGrade.PointsDenominator) * 100
          : finalGrade.GradeValue;

      await supabase
        .from('courses')
        .update({
          current_grade: currentGrade,
          final_grade_points: finalGrade.PointsNumerator,
          final_grade_denominator: finalGrade.PointsDenominator,
        })
        .eq('id', courseId);
    }
  } catch (error) {
    console.error(`Failed to sync grades for course ${orgUnitId}:`, error);
  }
}

async function syncAnnouncements(
  client: BrightspaceClient,
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
  orgUnitId: number
) {
  try {
    const announcements = await client.getAnnouncements(orgUnitId);

    for (const ann of announcements) {
      await supabase.from('announcements').upsert(
        {
          user_id: userId,
          course_id: courseId,
          brightspace_id: ann.Id,
          title: ann.Title,
          body: ann.Body?.Html ? stripHtml(ann.Body.Html) : null,
          created_date: ann.CreatedDate,
          is_global: ann.IsGlobal,
        },
        { onConflict: 'user_id,course_id,brightspace_id' }
      );
    }
  } catch (error) {
    console.error(`Failed to sync announcements for course ${orgUnitId}:`, error);
  }
}

export async function runIncrementalSync(userId: string, supabase: SupabaseClient) {
  try {
    await supabase
      .from('users')
      .update({ sync_status: 'syncing' })
      .eq('id', userId);

    const token = await getValidToken(userId);
    const client = new BrightspaceClient(token);

    // Get existing courses
    const { data: courses } = await supabase
      .from('courses')
      .select('id, brightspace_org_unit_id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (courses) {
      for (const course of courses) {
        await syncAssignments(client, supabase, userId, course.id, course.brightspace_org_unit_id);
        await syncGrades(client, supabase, userId, course.id, course.brightspace_org_unit_id);
        await syncAnnouncements(client, supabase, userId, course.id, course.brightspace_org_unit_id);
      }
    }

    await supabase
      .from('users')
      .update({
        sync_status: 'completed',
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', userId);
  } catch (error) {
    console.error('Incremental sync failed:', error);
    await supabase
      .from('users')
      .update({ sync_status: 'error' })
      .eq('id', userId);
  }
}
