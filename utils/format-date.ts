/**
 * Small utility to format a date as a string
 * in the format of "October 1, 2025"
 */
export function formatDateAsEnUs(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}
