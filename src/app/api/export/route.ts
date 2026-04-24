// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import { NextResponse, type NextRequest } from 'next/server';
import { getUserFromToken } from '@/lib/supabase/auth-helper';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const format = new URL(request.url).searchParams.get('format') || 'json';

  try {
    const [coursesRes, assignmentsRes, announcementsRes] = await Promise.all([
      supabase.from('courses').select('*').eq('user_id', user.id).eq('is_active', true),
      supabase.from('assignments').select('*, course:courses(name)').eq('user_id', user.id),
      supabase.from('announcements').select('*, course:courses(name)').eq('user_id', user.id),
    ]);

    const data = {
      exported_at: new Date().toISOString(),
      courses: coursesRes.data || [],
      assignments: assignmentsRes.data || [],
      announcements: announcementsRes.data || [],
    };

    if (format === 'csv') {
      // Generate CSV for assignments
      const headers = ['Course', 'Assignment', 'Due Date', 'Score', 'Possible', 'Completed'];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = (data.assignments as any[]).map((a) => [
        a.course?.name || '',
        a.name,
        a.due_date || '',
        a.points_numerator ?? '',
        a.points_denominator ?? '',
        a.is_completed ? 'Yes' : 'No',
      ]);

      const csv = [
        headers.join(','),
        ...rows.map((r) => r.map((v: string | number) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="beacon-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Export failed:', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
