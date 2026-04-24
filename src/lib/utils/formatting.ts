// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

export function formatGrade(points: number | null, denominator: number | null): string {
  if (points == null || denominator == null || denominator === 0) return 'N/A';
  const percentage = (points / denominator) * 100;
  return `${percentage.toFixed(1)}%`;
}

export function getLetterGrade(percentage: number): string {
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}
