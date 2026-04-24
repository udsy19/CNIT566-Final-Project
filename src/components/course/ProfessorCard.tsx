// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

function deriveName(user: { email?: string; user_metadata?: { full_name?: string; name?: string } } | null): string {
  if (!user) return '';
  const meta = user.user_metadata;
  if (meta?.full_name) return meta.full_name;
  if (meta?.name) return meta.name;
  if (!user.email) return '';
  // Derive from email prefix: udayatejas2004@gmail.com → "Udaya Tejas"
  const prefix = user.email.split('@')[0]
    .replace(/\d+/g, '') // strip numbers
    .replace(/[._-]+/g, ' ') // dots/underscores → space
    .trim();
  if (!prefix) return '';
  // Capitalize each word
  return prefix.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

interface ProfessorCardProps {
  courseId: string;
  courseName: string;
}

interface ProfessorInfo {
  name: string;
  email: string;
  phone: string;
  office: string;
  officeHours: string;
  officeHoursType: 'in-person' | 'online' | 'hybrid';
  zoomLink: string;
}

const emptyProf: ProfessorInfo = {
  name: '', email: '', phone: '', office: '', officeHours: '',
  officeHoursType: 'in-person', zoomLink: '',
};

export default function ProfessorCard({ courseId, courseName }: ProfessorCardProps) {
  const [prof, setProf] = useState<ProfessorInfo>(emptyProf);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<ProfessorInfo>(emptyProf);
  const [drafting, setDrafting] = useState(false);
  const [draftPrompt, setDraftPrompt] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [userName, setUserName] = useState('');

  const storageKey = `beacon-prof-${courseId}`;

  // Fetch user's name from Supabase auth
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        const name = deriveName(data.user as { email?: string; user_metadata?: { full_name?: string; name?: string } });
        setUserName(name);
      }
    });
  }, []);

  useEffect(() => {
    let current: ProfessorInfo | null = null;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        current = JSON.parse(saved);
        setProf(current!);
        setEditData(current!);
      } catch {}
    }
    // Always extract in background — show cached immediately, update if changed
    const run = async () => {
      await autoExtract(current);
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const autoExtract = async (current: ProfessorInfo | null, force = false) => {
    setExtracting(true);
    setExtractError(null);
    try {
      const res = await apiFetch('/api/course/extract-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });
      if (res.ok) {
        const { data } = await res.json();
        if (data) {
          const extracted: ProfessorInfo = {
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            office: data.office || '',
            officeHours: data.officeHours || '',
            officeHoursType: data.officeHoursType || 'in-person',
            zoomLink: data.zoomLink || '',
          };

          // Force update if user clicked re-extract, OR if the new data has MORE fields than cached
          const countFields = (p: ProfessorInfo) =>
            [p.name, p.email, p.phone, p.office, p.officeHours, p.zoomLink].filter(Boolean).length;

          const shouldUpdate = force ||
            !current ||
            countFields(extracted) > countFields(current) ||
            JSON.stringify(extracted) !== JSON.stringify(current);

          if (shouldUpdate && (extracted.name || extracted.email || extracted.phone || extracted.office)) {
            setProf(extracted);
            setEditData(extracted);
            localStorage.setItem(storageKey, JSON.stringify(extracted));
          }
        }
      } else {
        const { error } = await res.json();
        setExtractError(error || 'Could not find syllabus');
      }
    } catch {
      setExtractError('Failed to extract');
    } finally {
      setExtracting(false);
    }
  };

  const reExtract = () => {
    localStorage.removeItem(storageKey);
    setProf(emptyProf);
    setEditData(emptyProf);
    autoExtract(null, true);
  };

  const saveProf = () => {
    setProf(editData);
    localStorage.setItem(storageKey, JSON.stringify(editData));
    setEditing(false);
  };

  const handleDraft = async () => {
    if (!draftPrompt.trim()) return;
    setDraftLoading(true);
    setDraftContent('');

    try {
      const res = await apiFetch('/api/ask/course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          question: `Draft a short, professional email to Professor ${prof.name || 'the instructor'}. Student's request: "${draftPrompt}".

The student's name is "${userName || 'the student'}" — use this name in the sign-off.

Write ONLY plain text email body. No markdown, no explanation, no subject line. Use this structure with blank lines between paragraphs:

Dear Professor ${prof.name?.split(' ').pop() || 'Professor'},

[1-2 sentences stating the reason for writing]

[1-2 sentences with any relevant specifics]

Thank you for your time.

Sincerely,
${userName || '[Your Name]'}

Keep it under 100 words. Blank lines between paragraphs. End with "Sincerely," on its own line, then "${userName || '[Your Name]'}" on the next line.`,
        }),
      });

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';
      let content = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              content += parsed.content;
              setDraftContent(content);
            }
          } catch {}
        }
      }
    } catch {
      setDraftContent('Failed to draft email. Please try again.');
    } finally {
      setDraftLoading(false);
    }
  };

  const copyDraft = () => {
    navigator.clipboard.writeText(draftContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openInEmail = () => {
    const subject = encodeURIComponent(`${courseName} — ${draftPrompt}`);
    const body = encodeURIComponent(draftContent);
    const to = prof.email || '';
    window.open(`mailto:${to}?subject=${subject}&body=${body}`);
  };

  const hasInfo = prof.name || prof.email;

  return (
    <div className="p-4 md:p-6 rounded-2xl border border-border bg-background">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Instructor</p>
        <div className="flex items-center gap-3">
          {hasInfo && !editing && (
            <button
              onClick={reExtract}
              disabled={extracting}
              title="Re-extract from syllabus"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {extracting ? 'Re-extracting...' : 'Re-extract'}
            </button>
          )}
          <button
            onClick={() => { setEditing(!editing); setEditData(prof); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {editing ? 'Cancel' : hasInfo ? 'Edit' : 'Add info'}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {editing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <input
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              placeholder="Professor name"
              className="w-full px-4 py-3 md:py-2.5 text-base md:text-sm bg-background border border-border rounded-full outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
            />
            <input
              value={editData.email}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              placeholder="Email address"
              type="email"
              className="w-full px-4 py-3 md:py-2.5 text-base md:text-sm bg-background border border-border rounded-full outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
            />
            <input
              value={editData.phone}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
              placeholder="Phone (e.g., 765-494-1000)"
              type="tel"
              className="w-full px-4 py-3 md:py-2.5 text-base md:text-sm bg-background border border-border rounded-full outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
            />
            <input
              value={editData.office}
              onChange={(e) => setEditData({ ...editData, office: e.target.value })}
              placeholder="Office (e.g., KNOY 254)"
              className="w-full px-4 py-3 md:py-2.5 text-base md:text-sm bg-background border border-border rounded-full outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
            />
            <input
              value={editData.officeHours}
              onChange={(e) => setEditData({ ...editData, officeHours: e.target.value })}
              placeholder="Office hours (e.g., Tue/Thu 2-3pm)"
              className="w-full px-4 py-3 md:py-2.5 text-base md:text-sm bg-background border border-border rounded-full outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
            />
            <div className="flex gap-2">
              {(['in-person', 'online', 'hybrid'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setEditData({ ...editData, officeHoursType: t })}
                  className={`px-3.5 py-2 md:py-1.5 rounded-full text-xs transition-all ${
                    editData.officeHoursType === t ? 'bg-foreground text-background' : 'border border-border text-muted-foreground active:bg-muted/30'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {(editData.officeHoursType === 'online' || editData.officeHoursType === 'hybrid') && (
              <input
                value={editData.zoomLink}
                onChange={(e) => setEditData({ ...editData, zoomLink: e.target.value })}
                placeholder="Zoom/Teams link"
                className="w-full px-4 py-3 md:py-2.5 text-base md:text-sm bg-background border border-border rounded-full outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
              />
            )}
            <motion.button
              onClick={saveProf}
              className="px-5 py-2 rounded-full bg-foreground text-background text-sm font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Save
            </motion.button>
          </motion.div>
        ) : hasInfo ? (
          <motion.div
            key="display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="space-y-2.5">
              {prof.name && <p className="text-sm font-medium">{prof.name}</p>}

              {prof.email && (
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-muted-foreground font-mono uppercase tracking-wider min-w-[50px]">Email</span>
                  <a
                    href={`mailto:${prof.email}`}
                    className="text-foreground hover:underline break-all"
                  >
                    {prof.email}
                  </a>
                </div>
              )}

              {prof.phone && (
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-muted-foreground font-mono uppercase tracking-wider min-w-[50px]">Phone</span>
                  <a
                    href={`tel:${prof.phone.replace(/\D/g, '')}`}
                    className="text-foreground hover:underline"
                  >
                    {prof.phone}
                  </a>
                </div>
              )}

              {prof.office && (
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-muted-foreground font-mono uppercase tracking-wider min-w-[50px]">Office</span>
                  <span className="text-foreground">{prof.office}</span>
                </div>
              )}

              {prof.officeHours && (() => {
                // Detect if officeHours is actually a URL (e.g., booking link)
                const urlMatch = prof.officeHours.match(/https?:\/\/[^\s]+/);
                const isUrl = urlMatch && urlMatch[0].length > prof.officeHours.length - 20;

                if (isUrl) {
                  return (
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-muted-foreground font-mono uppercase tracking-wider min-w-[50px]">Book</span>
                      <a
                        href={urlMatch[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground underline hover:text-muted-foreground truncate"
                      >
                        Book appointment
                      </a>
                    </div>
                  );
                }

                return (
                  <div className="flex items-start gap-2 text-xs min-w-0">
                    <span className="text-muted-foreground font-mono uppercase tracking-wider min-w-[50px] shrink-0">Hours</span>
                    <span className="text-foreground break-words min-w-0">
                      {prof.officeHours}
                      {prof.officeHoursType !== 'in-person' && (
                        <span className="text-muted-foreground"> · {prof.officeHoursType}</span>
                      )}
                      {prof.zoomLink && (
                        <> · <a href={prof.zoomLink} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Join</a></>
                      )}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Email draft button — always available */}
            <div className="mt-4">
              <motion.button
                onClick={() => setDrafting(!drafting)}
                  className="px-4 py-2 rounded-full text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {drafting ? 'Close' : 'Draft email'}
                </motion.button>

                <AnimatePresence>
                  {drafting && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-3">
                        <div className="flex gap-2">
                          <input
                            value={draftPrompt}
                            onChange={(e) => setDraftPrompt(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleDraft()}
                            placeholder="e.g., request extension on Lab 5"
                            className="flex-1 px-4 py-2 text-sm bg-background border border-border rounded-full outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
                          />
                          <motion.button
                            onClick={handleDraft}
                            disabled={draftLoading || !draftPrompt.trim()}
                            className="px-4 py-2 rounded-full bg-foreground text-background text-xs font-medium disabled:opacity-30"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {draftLoading ? 'Drafting...' : 'Draft'}
                          </motion.button>
                        </div>

                        {draftContent && (
                          <div className="p-4 rounded-xl border border-border/50 bg-muted/30">
                            <pre className="text-sm text-foreground/90 whitespace-pre-wrap font-sans leading-relaxed">{draftContent.trim()}</pre>
                            {draftLoading && (
                              <motion.span
                                animate={{ opacity: [1, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                                className="inline-block w-0.5 h-4 bg-foreground ml-0.5 align-text-bottom"
                              />
                            )}
                            {!draftLoading && (
                              <div className="flex gap-2 mt-3">
                                <motion.button
                                  onClick={copyDraft}
                                  className="px-4 py-1.5 rounded-full text-xs border border-border text-muted-foreground hover:text-foreground transition-colors"
                                  whileTap={{ scale: 0.95 }}
                                >
                                  {copied ? 'Copied' : 'Copy'}
                                </motion.button>
                                <motion.button
                                  onClick={openInEmail}
                                  className="px-4 py-1.5 rounded-full text-xs bg-foreground text-background font-medium"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  Open in email
                                </motion.button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {extracting ? (
              <div className="flex items-center gap-2 py-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full"
                />
                <span className="text-sm text-muted-foreground">Looking for instructor info...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  {extractError || 'No instructor info found automatically.'}
                </p>
                <button
                  onClick={() => { setEditing(true); setEditData(emptyProf); }}
                  className="px-4 py-2.5 md:py-2 rounded-full text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 active:bg-muted/30 transition-all"
                >
                  Add instructor info
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
