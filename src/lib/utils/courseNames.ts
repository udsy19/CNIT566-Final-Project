/**
 * Extract a short course name from Brightspace's verbose format.
 * e.g. "Spring 2026 CNIT 56600-001 LEC" → "CNIT 56600"
 */
export function getShortName(name: string): string {
  const match = name.match(
    /(?:Spring|Fall|Summer)\s+\d{4}\s+(.+?)(?:\s*[-–]\s*(?:Merge|LEC|LAB|DIS|REC|SD)|$)/i
  );
  if (match) {
    return match[1].replace(/[-–]\d+$/, '').trim();
  }
  // Fallback: first 3 words
  return name.split(' ').slice(0, 3).join(' ');
}
