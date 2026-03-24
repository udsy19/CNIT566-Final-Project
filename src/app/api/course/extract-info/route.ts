import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromToken } from '@/lib/supabase/auth-helper';
import { generateCompletion } from '@/lib/ai/client';

const EXTRACT_PROMPT = `Extract instructor/professor information from this text. Return ONLY valid JSON with no extra text:

{"name":"Full Name or null","email":"email@purdue.edu or null","office":"Building Room or null","officeHours":"Day/Time or null","officeHoursType":"in-person","zoomLink":"URL or null"}

Use null for missing fields. Don't guess.`;

export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { courseId } = await request.json();
  if (!courseId) {
    return NextResponse.json({ error: 'courseId required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const [userRes, courseRes] = await Promise.all([
    supabase.from('users').select('brightspace_access_token').eq('id', user.id).single(),
    supabase.from('courses').select('brightspace_org_unit_id, name').eq('id', courseId).eq('user_id', user.id).single(),
  ]);

  if (!courseRes.data) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  const orgUnitId = courseRes.data.brightspace_org_unit_id;

  // Gather text from multiple sources
  let allText = '';

  // Source 1: Announcements from DB (already synced)
  const { data: announcements } = await supabase
    .from('announcements')
    .select('title, body')
    .eq('course_id', courseId)
    .eq('user_id', user.id)
    .order('created_date', { ascending: true })
    .limit(5);

  if (announcements) {
    for (const a of announcements) {
      if (a.body) {
        const text = a.body.replace(/<[^>]*>/g, ' ').trim();
        if (text.toLowerCase().includes('instructor') || text.toLowerCase().includes('professor') ||
            text.toLowerCase().includes('office') || text.toLowerCase().includes('@purdue.edu')) {
          allText += text + '\n\n';
        }
      }
    }
  }

  // Source 2: Content module descriptions from DB
  const { data: modules } = await supabase
    .from('content_modules')
    .select('title, description')
    .eq('course_id', courseId)
    .eq('user_id', user.id)
    .limit(10);

  if (modules) {
    for (const m of modules) {
      if (m.description) {
        const text = m.description.replace(/<[^>]*>/g, ' ').trim();
        if (text.length > 20) allText += text + '\n\n';
      }
    }
  }

  // Source 3: Fetch the course homepage from Brightspace if we have cookies
  if (userRes.data?.brightspace_access_token) {
    try {
      const cookies = JSON.parse(userRes.data.brightspace_access_token);
      const cookieHeader = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');

      // Fetch course homepage
      const homeRes = await fetch(`https://purdue.brightspace.com/d2l/home/${orgUnitId}`, {
        headers: { Cookie: cookieHeader },
        redirect: 'manual',
      });

      if (homeRes.ok) {
        const html = await homeRes.text();
        // Extract text content, strip HTML
        const textContent = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // Look for instructor-related sections
        const lower = textContent.toLowerCase();
        if (lower.includes('instructor') || lower.includes('professor') ||
            lower.includes('office hour') || lower.includes('@purdue.edu')) {
          allText += textContent.slice(0, 3000) + '\n\n';
        }
      }

      // Also try the content overview page
      const contentRes = await fetch(`https://purdue.brightspace.com/d2l/le/content/${orgUnitId}/Home`, {
        headers: { Cookie: cookieHeader },
        redirect: 'manual',
      });

      if (contentRes.ok) {
        const html = await contentRes.text();
        const textContent = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        const lower = textContent.toLowerCase();
        if (lower.includes('instructor') || lower.includes('professor') ||
            lower.includes('office hour') || lower.includes('@purdue.edu')) {
          allText += textContent.slice(0, 3000) + '\n\n';
        }
      }
    } catch (err) {
      console.error('Failed to fetch from Brightspace:', err);
      // Continue with DB data only
    }
  }

  if (!allText.trim()) {
    return NextResponse.json({ error: 'No instructor info found in course data' }, { status: 404 });
  }

  // Truncate to avoid overloading the LLM
  allText = allText.slice(0, 4000);

  try {
    const result = await generateCompletion(
      EXTRACT_PROMPT,
      allText,
      { maxTokens: 300, temperature: 0.1 }
    );

    // Parse JSON from response
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse response' }, { status: 500 });
    }

    const profInfo = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ data: profInfo });
  } catch (err) {
    console.error('AI extraction failed:', err);
    return NextResponse.json({ error: 'Failed to extract info' }, { status: 500 });
  }
}
