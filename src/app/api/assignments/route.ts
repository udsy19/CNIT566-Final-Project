import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromToken } from '@/lib/supabase/auth-helper';

export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  const searchParams = request.nextUrl.searchParams;
  const courseId = searchParams.get('courseId');
  const upcoming = searchParams.get('upcoming');

  let query = supabase
    .from('assignments')
    .select('*, course:courses(*)')
    .eq('user_id', user.id);

  if (courseId) {
    query = query.eq('course_id', courseId);
  }

  if (upcoming === 'true') {
    query = query
      .gte('due_date', new Date().toISOString())
      .eq('is_completed', false)
      .order('due_date', { ascending: true })
      .limit(20);
  } else {
    query = query.order('due_date', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
