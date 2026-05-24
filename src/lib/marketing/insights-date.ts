/**
 * Format an ISO date string (YYYY-MM-DD) as "May 23, 2026".
 * Uses UTC to keep server-rendered output stable across timezones.
 */
export function formatInsightDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
