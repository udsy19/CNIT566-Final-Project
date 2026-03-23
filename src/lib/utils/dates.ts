import { format, formatDistanceToNow, isPast, isToday, isTomorrow, addDays, isWithinInterval } from 'date-fns';

export function formatDueDate(dateString: string): string {
  const date = new Date(dateString);

  if (isPast(date)) return 'Overdue';
  if (isToday(date)) return `Today at ${format(date, 'h:mm a')}`;
  if (isTomorrow(date)) return `Tomorrow at ${format(date, 'h:mm a')}`;
  if (isWithinInterval(date, { start: new Date(), end: addDays(new Date(), 7) })) {
    return format(date, 'EEEE, h:mm a');
  }
  return format(date, 'MMM d, h:mm a');
}

export function formatRelative(dateString: string): string {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
}

export function formatDate(dateString: string): string {
  return format(new Date(dateString), 'MMM d, yyyy');
}
