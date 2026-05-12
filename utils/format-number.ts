/**
export const formatNumberWithCommas = (
 * Small utility to format a number as a string
 * with commas and optional fraction digits
 */
export function formatNumberWithCommas(
  value: number,
  withFractionDigits: boolean = false
): string {
  return Intl.NumberFormat('en-us', {
    minimumFractionDigits: withFractionDigits ? 2 : undefined,
    maximumFractionDigits: withFractionDigits ? 2 : undefined,
  })
    .format(value)
    .toString()
}
