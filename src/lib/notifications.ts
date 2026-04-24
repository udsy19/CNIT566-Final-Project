// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

const NOTIFIED_KEY = 'beacon-notified-assignments';

function getNotifiedIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function markNotified(id: string) {
  const ids = getNotifiedIds();
  ids.add(id);
  // Keep only last 100 to prevent unbounded growth
  const arr = [...ids].slice(-100);
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(arr));
}

export function checkDeadlineNotifications(assignments: { id: string; name: string; due_date: string | null; is_completed: boolean; course_id: string }[], courseNames: Map<string, string>) {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  if (localStorage.getItem('beacon-notifications') !== 'true') return;

  const reminderHours = parseInt(localStorage.getItem('beacon-reminder-hours') || '2');
  const now = Date.now();
  const windowMs = reminderHours * 60 * 60 * 1000;
  const notified = getNotifiedIds();

  for (const a of assignments) {
    if (!a.due_date || a.is_completed) continue;
    if (notified.has(a.id)) continue;

    const due = new Date(a.due_date).getTime();
    const timeLeft = due - now;

    // Notify if within the reminder window and not past due
    if (timeLeft > 0 && timeLeft <= windowMs) {
      const hoursLeft = Math.round(timeLeft / (60 * 60 * 1000));
      const courseName = courseNames.get(a.course_id) || '';
      const timeStr = hoursLeft < 1 ? 'less than 1 hour' : `${hoursLeft}h`;

      new Notification(`${a.name} due in ${timeStr}`, {
        body: courseName ? `${courseName} — don't forget to submit` : "Don't forget to submit",
        icon: '/favicon.ico',
        tag: `deadline-${a.id}`, // Prevents duplicate notifications
      });

      markNotified(a.id);
    }
  }
}
