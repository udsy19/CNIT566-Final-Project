'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import ChatMarkdown from '@/components/ui/ChatMarkdown';

interface ProfessorCardProps {
  courseId: string;
  courseName: string;
}

interface ProfessorInfo {
  name: string;
  email: string;
  office: string;
  officeHours: string;
  officeHoursType: 'in-person' | 'online' | 'hybrid';
  zoomLink: string;
}

const emptyProf: ProfessorInfo = {
  name: '', email: '', office: '', officeHours: '',
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

  const storageKey = `beacon-prof-${courseId}`;

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

  const autoExtract = async (current: ProfessorInfo | null) => {
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
            office: data.office || '',
            officeHours: data.officeHours || '',
            officeHoursType: data.officeHoursType || 'in-person',
            zoomLink: data.zoomLink || '',
          };
          // Only update if we found data AND it's different from cached
          if ((extracted.name || extracted.email) &&
              JSON.stringify(extracted) !== JSON.stringify(current)) {
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
          question: `Draft a professional email to Professor ${prof.name || 'the instructor'} (${prof.email || 'instructor'}). The student's request: "${draftPrompt}". Write ONLY the email body — no explanation, no subject line suggestions. Keep it concise and professional. Start with "Dear Professor ${prof.name?.split(' ').pop() || 'Professor'},".`,
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
    window.open(`mailto:${prof.email}?subject=${subject}&body=${body}`);
  };

  const hasInfo = prof.name || prof.email;

  return (
    <div className="p-4 md:p-6 rounded-2xl border border-border bg-background">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Instructor</p>
        <button
          onClick={() => { setEditing(!editing); setEditData(prof); }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {editing ? 'Cancel' : hasInfo ? 'Edit' : 'Add info'}
        </button>
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
              className="w-full px-4 py-2 text-sm bg-background border border-border rounded-full outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
            />
            <input
              value={editData.email}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              placeholder="Email address"
              className="w-full px-4 py-2 text-sm bg-background border border-border rounded-full outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
            />
            <input
              value={editData.office}
              onChange={(e) => setEditData({ ...editData, office: e.target.value })}
              placeholder="Office (e.g., KNOY 254)"
              className="w-full px-4 py-2 text-sm bg-background border border-border rounded-full outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
            />
            <input
              value={editData.officeHours}
              onChange={(e) => setEditData({ ...editData, officeHours: e.target.value })}
              placeholder="Office hours (e.g., Tue/Thu 2-3pm)"
              className="w-full px-4 py-2 text-sm bg-background border border-border rounded-full outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
            />
            <div className="flex gap-2">
              {(['in-person', 'online', 'hybrid'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setEditData({ ...editData, officeHoursType: t })}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                    editData.officeHoursType === t ? 'bg-foreground text-background' : 'border border-border text-muted-foreground'
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
                className="w-full px-4 py-2 text-sm bg-background border border-border rounded-full outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
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
            <div className="space-y-2">
              {prof.name && <p className="text-sm font-medium">{prof.name}</p>}
              {prof.email && (
                <p className="text-sm text-muted-foreground">
                  <a href={`mailto:${prof.email}`} className="hover:text-foreground transition-colors">{prof.email}</a>
                </p>
              )}
              {prof.office && <p className="text-xs text-muted-foreground">Office: {prof.office}</p>}
              {prof.officeHours && (
                <p className="text-xs text-muted-foreground">
                  Hours: {prof.officeHours} ({prof.officeHoursType})
                  {prof.zoomLink && (
                    <> · <a href={prof.zoomLink} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Join online</a></>
                  )}
                </p>
              )}
            </div>

            {/* Email draft button */}
            {prof.email && (
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
                            <ChatMarkdown content={draftContent} />
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
            )}
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
                <span className="text-sm text-muted-foreground">Extracting from syllabus...</span>
              </div>
            ) : extractError ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{extractError}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => autoExtract(null)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => { setEditing(true); setEditData(emptyProf); }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Add manually
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No instructor info found.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
