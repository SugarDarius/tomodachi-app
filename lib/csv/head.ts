import { parse } from 'csv-parse/browser/esm/sync'
import type { PreviewResult } from '~/lib/csv/contact-import'

const PREVIEW_BYTES = 1024 * 1024 // 1MB

/**
 * Parses only a prefix of the CSV so users see headers + sample rows immediately.
 *
 * The slice is trimmed back to the last newline so the trailing row is always
 * complete otherwise `csv-parse` would emit a half-row with mid-cell garbled
 * values for big files where 768 KiB lands mid-row.
 */
export async function previewCsvHead(file: File): Promise<PreviewResult> {
  const blob = file.slice(0, Math.min(PREVIEW_BYTES, file.size))
  const rawText = await blob.text()

  let safeText = rawText
  if (blob.size < file.size) {
    const lastNewline = rawText.lastIndexOf('\n')
    if (lastNewline >= 0) {
      safeText = rawText.slice(0, lastNewline + 1)
    }
  }

  const records = parse(safeText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: true,
  }) as Record<string, string>[]

  const headers = records.length > 0 ? Object.keys(records[0]) : []

  const usableRows = records.filter((row) =>
    Object.keys(row).some((key) => (row[key] ?? '').trim().length > 0)
  )

  const sampleRows = usableRows.slice(0, 40)

  return {
    headers,
    sampleRows,
    fileSizeBytes: file.size,
    sampleBytes: new TextEncoder().encode(safeText).length,
    sampleRowCount: usableRows.length,
    fileName: file.name,
  }
}
