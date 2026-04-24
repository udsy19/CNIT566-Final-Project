// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromToken } from '@/lib/supabase/auth-helper';
import { generateCompletion } from '@/lib/ai/client';

const EXTRACT_PROMPT = `You are extracting instructor contact information from a course syllabus. Read the ENTIRE text carefully. Instructor info is often spread across multiple lines under headings like "Instructor", "Professor", "Teaching Team", "Contact Information", "Instructor(s) Contact Information".

Respond with ONLY a JSON object. No markdown fences, no explanation.

Required JSON:
{
  "name": "Full name with title (e.g. Dr. Tianyi Li, Prof. John Smith)" or null,
  "email": "email@purdue.edu" or null,
  "phone": "phone number as it appears (e.g. 765-496-0792)" or null,
  "office": "Building and room (e.g. KNOY 241, LWSN B148, Online only)" or null,
  "officeHours": "Day/Time (e.g. Tue/Thu 2-3pm, By appointment, schedule by email)" or null,
  "officeHoursType": "in-person" | "online" | "hybrid",
  "zoomLink": "URL if one is listed" or null
}

CRITICAL RULES:
- Use JSON null (not "null" string) for missing fields
- Scan the FULL text, not just the top — contact info is often spread out
- Common patterns to look for:
  * "Email:", "E-mail:", "Purdue Email Address:", "@purdue.edu"
  * "Phone:", "Office Phone:", "Office Phone Number:", phone numbers with area codes like 765-XXX-XXXX
  * "Office:", "Office Location:", building codes like KNOY, LWSN, EE, WTHR
  * "Office Hours:", "By appointment", "schedule by email"
- If there are multiple instructors, pick the primary one (labeled "Instructor" or "Professor" not "TA")
- Extract EXACTLY as written. Don't paraphrase.
- If office hours say "by appointment" or "schedule by email", include that text in officeHours

URL HANDLING:
- If you find a BOOKING URL (outlook.office.com/bookwithme, calendly.com, etc.) — put it in zoomLink, NOT officeHours
- If you find a ZOOM URL (zoom.us) — put it in zoomLink
- officeHours should be HUMAN-READABLE text like "Tue/Thu 2-3pm" or "By appointment" — never raw URLs
- If the only office hours info is a booking URL, set officeHours to "By appointment" and put URL in zoomLink

Output ONLY the JSON object. Nothing else before or after.`;

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function downloadAndExtractText(url: string, cookieHeader: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { Cookie: cookieHeader },
      redirect: 'follow',
    });
    if (!res.ok) return '';

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('pdf')) {
      const buffer = Buffer.from(await res.arrayBuffer());
      const pdfParseModule = await import('pdf-parse');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParse = ((pdfParseModule as any).default || pdfParseModule) as (b: Buffer) => Promise<{ text: string }>;
      const pdf = await pdfParse(buffer);
      return pdf.text;
    } else if (contentType.includes('html') || contentType.includes('text') || contentType.includes('json')) {
      const html = await res.text();
      return stripHtml(html);
    }
    return '';
  } catch (err) {
    console.error('Failed to download/extract:', url, err);
    return '';
  }
}

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
  const cookieHeader = userRes.data?.brightspace_access_token
    ? (() => {
        try {
          const cookies = JSON.parse(userRes.data!.brightspace_access_token!);
          return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
        } catch {
          return '';
        }
      })()
    : '';

  let collectedText = '';
  const sources: string[] = [];

  // STEP 1: Search Brightspace TOC for syllabus-like topics (via Valence API)
  if (cookieHeader) {
    try {
      const tocRes = await fetch(
        `https://purdue.brightspace.com/d2l/api/le/1.74/${orgUnitId}/content/toc`,
        { headers: { Cookie: cookieHeader } }
      );

      if (tocRes.ok) {
        const toc = await tocRes.json();
        const allTopics: { title: string; url?: string; id: number }[] = [];

        const walk = (modules: Array<Record<string, unknown>>) => {
          for (const m of modules || []) {
            const topics = (m.Topics || []) as Array<Record<string, unknown>>;
            for (const t of topics) {
              allTopics.push({
                title: String(t.Title || ''),
                url: t.Url as string | undefined,
                id: Number(t.TopicId || 0),
              });
            }
            if (m.Modules) walk(m.Modules as Array<Record<string, unknown>>);
          }
        };
        walk(toc.Modules || []);

        // Find ALL syllabus-like topics (could be "Syllabus", "Course Syllabus", "Syllabus.pdf", etc.)
        const syllabusTopics = allTopics.filter(t =>
          /syllabus/i.test(t.title) ||
          /instructor/i.test(t.title) ||
          /contact/i.test(t.title) ||
          (t.url && /syllabus/i.test(t.url))
        );

        console.log(`[extract-info] course=${courseRes.data.name} — found ${syllabusTopics.length} syllabus-like topics`);

        for (const topic of syllabusTopics.slice(0, 5)) {
          if (!topic.url) continue;
          const fileUrl = topic.url.startsWith('http')
            ? topic.url
            : `https://purdue.brightspace.com${topic.url}`;
          const text = await downloadAndExtractText(fileUrl, cookieHeader);
          if (text.length > 200) {
            collectedText += `\n\n=== ${topic.title} ===\n${text}`;
            sources.push(topic.title);
            console.log(`[extract-info] extracted ${text.length} chars from "${topic.title}"`);
          }
        }
      } else {
        console.log(`[extract-info] TOC fetch failed: ${tocRes.status}`);
      }
    } catch (err) {
      console.error('[extract-info] TOC step failed:', err);
    }
  }

  // STEP 2: Search DB for syllabus-like content topics (already synced)
  if (collectedText.length < 500) {
    const { data: syllabusTopics } = await supabase
      .from('content_topics')
      .select('title, url')
      .eq('course_id', courseId)
      .eq('user_id', user.id)
      .or('title.ilike.%syllabus%,title.ilike.%instructor%,title.ilike.%contact%')
      .limit(5);

    if (syllabusTopics && cookieHeader) {
      for (const t of syllabusTopics) {
        if (!t.url) continue;
        const url = t.url.startsWith('http') ? t.url : `https://purdue.brightspace.com${t.url}`;
        const text = await downloadAndExtractText(url, cookieHeader);
        if (text.length > 200) {
          collectedText += `\n\n=== ${t.title} ===\n${text}`;
          sources.push(t.title);
        }
      }
    }
  }

  // STEP 3: Fallback — announcements and module descriptions
  if (collectedText.length < 200) {
    const { data: announcements } = await supabase
      .from('announcements')
      .select('title, body')
      .eq('course_id', courseId)
      .eq('user_id', user.id)
      .limit(10);

    if (announcements) {
      for (const a of announcements) {
        if (a.body) {
          const text = stripHtml(a.body);
          if (text.length > 30) collectedText += `\n\n=== Announcement: ${a.title} ===\n${text.slice(0, 1000)}`;
        }
      }
      if (announcements.length > 0) sources.push(`${announcements.length} announcements`);
    }

    const { data: modules } = await supabase
      .from('content_modules')
      .select('title, description')
      .eq('course_id', courseId)
      .eq('user_id', user.id)
      .limit(10);

    if (modules) {
      for (const m of modules) {
        if (m.description) {
          const text = stripHtml(m.description);
          if (text.length > 50) collectedText += `\n\n=== Module: ${m.title} ===\n${text}`;
        }
      }
    }
  }

  if (!collectedText.trim()) {
    return NextResponse.json({
      error: 'No syllabus found for this course. Please add instructor info manually.'
    }, { status: 404 });
  }

  console.log(`[extract-info] sources used: ${sources.join(', ')} — total ${collectedText.length} chars`);

  // Send up to 15000 chars — the model handles this comfortably
  const userContent = `Course: ${courseRes.data.name}

Below is the full text extracted from this course's syllabus and related materials. Find the instructor contact information.

${collectedText.slice(0, 15000)}`;

  try {
    const result = await generateCompletion(
      EXTRACT_PROMPT,
      userContent,
      { maxTokens: 600, temperature: 0 }
    );

    // Extract JSON from response (handle any wrapper text)
    let profInfo: Record<string, unknown> | null = null;
    const startIdx = result.indexOf('{');
    if (startIdx !== -1) {
      let depth = 0;
      let endIdx = -1;
      for (let i = startIdx; i < result.length; i++) {
        if (result[i] === '{') depth++;
        if (result[i] === '}') depth--;
        if (depth === 0) { endIdx = i; break; }
      }
      if (endIdx !== -1) {
        const jsonStr = result.slice(startIdx, endIdx + 1);
        try {
          profInfo = JSON.parse(jsonStr);
        } catch {
          const cleaned = jsonStr
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']')
            .replace(/:\s*"null"/g, ': null')
            .replace(/"\s*\|\s*null/g, 'null');
          try { profInfo = JSON.parse(cleaned); } catch {}
        }
      }
    }

    if (!profInfo) {
      console.error('[extract-info] AI response could not be parsed:', result.slice(0, 500));
      return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 });
    }

    const hasAnyData = profInfo.name || profInfo.email || profInfo.office || profInfo.officeHours || profInfo.phone;
    if (!hasAnyData) {
      return NextResponse.json({
        error: 'Found course materials but no instructor info inside them. Please add manually.',
      }, { status: 404 });
    }

    console.log(`[extract-info] extracted:`, {
      name: profInfo.name,
      email: profInfo.email,
      phone: profInfo.phone,
      office: profInfo.office,
      officeHours: profInfo.officeHours,
    });

    return NextResponse.json({ data: profInfo });
  } catch (err) {
    console.error('[extract-info] AI extraction failed:', err);
    return NextResponse.json({ error: 'Failed to extract info' }, { status: 500 });
  }
}
