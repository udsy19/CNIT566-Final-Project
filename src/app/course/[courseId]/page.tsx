import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import CourseDetailContent from '@/components/course/CourseDetailContent';
import type { Course, Assignment, ContentModule, ContentTopic, Announcement } from '@/types';

export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const adminClient = createAdminClient();
  const [courseRes, assignmentsRes, modulesRes, topicsRes, announcementsRes] = await Promise.all([
    adminClient.from('courses').select('*').eq('id', courseId).eq('user_id', user.id).single(),
    adminClient.from('assignments').select('*').eq('course_id', courseId).eq('user_id', user.id).order('due_date', { ascending: false, nullsFirst: false }),
    adminClient.from('content_modules').select('*').eq('course_id', courseId).eq('user_id', user.id).order('sort_order'),
    adminClient.from('content_topics').select('*').eq('course_id', courseId).eq('user_id', user.id).order('sort_order'),
    adminClient.from('announcements').select('*').eq('course_id', courseId).eq('user_id', user.id).order('created_date', { ascending: false }),
  ]);

  if (!courseRes.data) return notFound();

  return (
    <>
      <TopBar title={courseRes.data.name} />
      <CourseDetailContent
        course={courseRes.data as Course}
        assignments={(assignmentsRes.data || []) as Assignment[]}
        modules={(modulesRes.data || []) as ContentModule[]}
        topics={(topicsRes.data || []) as ContentTopic[]}
        announcements={(announcementsRes.data || []) as Announcement[]}
      />
    </>
  );
}
