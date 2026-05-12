export type PreviewResult = {
  /** The headers of the CSV file. */
  headers: string[]
  sampleRows: Record<string, string>[]
  /** Total size of the user-selected File. */
  fileSizeBytes: number
  /** Byte length of the slice we actually parsed (≤ PREVIEW_BYTES). */
  sampleBytes: number
  /** Non-empty rows successfully parsed from the slice (= `sampleRows.length` after filtering). */
  sampleRowCount: number
  /** The file name of the user-selected File. */
  fileName: string
}

export type CreateContactImportResponseBody = {
  /** The unique identifier for the contact import. */
  importId: string
  /** The unique identifier for the workflow run. */
  workflowRunId: string
}

/**
 * Progress of the ongoing contact import ingest job.
 */
export type ContactImportProgress = {
  /** Number of rows inspected by the ingest job. */
  numberOfInspectedRows: number
  /** Number of rows ingested by the ingest job. */
  numberOfIngestedRows: number
  /** Number of rows skipped by the ingest job. */
  numberOfSkippedRows: number
  /** Byte offset into the blob file already processed by the previous chunks during the ingestion process. */
  cursorByte: number
  /** Total byte size of the blob. */
  totalByteSize: number | null
}
