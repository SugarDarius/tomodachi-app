import { Readable } from 'node:stream'
import { head } from '@vercel/blob'

import { FatalError } from 'workflow'
import { parse } from 'csv-parse'

import { and, eq, isNull, sql } from 'drizzle-orm'

import { env } from '~/env'
import {
  contacts,
  contactImports,
  type ContactImportErrorEntry,
  CONTACT_IMPORT_ERRORS_CAPACITY,
  contactsListMembers,
  contactsLists,
  type ContactImportChunk,
  type CreateContactImportChunk,
  contactImportChunks,
} from '~/schema'
import { db } from '~/lib/db'
import { columnMappingRefsByIndex } from '~/lib/csv/columns'
import {
  mapContactImportRow,
  type MappedContactImportRow,
} from '~/lib/csv/rows'

/**
 * The size of the chunk to ingest.
 * 4Mb is empirically the sweet spot for 10k to 40k rows
 * to ingest with speed and memory efficiency.
 */
const CHUNK_SIZE = 1024 * 1024 * 4

/**
 * The size of the batch to upsert contacts.
 * 1ks rows per upsert batch operation to avoid PostgreSQL's cursor limit.
 */
const BATCH_UPSERT_SIZE = 1000

/**
 * Number of max concurrent chunks to ingest in parallel.
 */
const PARALLEL_CHUNK_LIMIT = 4

/* fail the workflow explcitly with a `FatalError` */
const failWorkflow = (message: string): never => {
  throw new FatalError(message)
}

/** Append error entries to the import. */
async function appendImportErrorEntries({
  importId,
  entries,
}: {
  importId: string
  entries: ContactImportErrorEntry[]
}): Promise<void> {
  if (entries.length === 0) {
    return
  }

  const incoming = JSON.stringify(entries)

  await db
    .update(contactImports)
    .set({
      errors: sql`(
        SELECT COALESCE(
          jsonb_agg(elem ORDER BY ord ASC),
          '[]'::jsonb
        )
        FROM (
          SELECT elem, ord
          FROM jsonb_array_elements(
            COALESCE(${contactImports.errors}, '[]'::jsonb) || ${incoming}::jsonb
          ) WITH ORDINALITY AS u(elem, ord)
          ORDER BY ord DESC
          LIMIT ${CONTACT_IMPORT_ERRORS_CAPACITY}
        ) recent
      )`,
      updatedAt: sql`now()`,
    })
    .where(eq(contactImports.id, importId))
}

/**
 * Fetch the blob size from the blob storage.
 */
async function fetchBlobSize({
  blobUrl,
}: {
  blobUrl: string
}): Promise<number> {
  const { size } = await head(blobUrl, {
    token: env.BLOB_READ_WRITE_TOKEN,
  })

  return size
}

/**
 * Fetch a chunk of the blob by range.
 */
const fetchBlobChunkByRange = async ({
  url,
  start,
  end,
}: {
  url: string
  start: number
  end: number
}): Promise<ArrayBuffer> => {
  const res = await fetch(url, {
    headers: {
      Range: `bytes=${start}-${end}`,
      Authorization: `Bearer ${env.BLOB_READ_WRITE_TOKEN}`,
    },
  })

  if (!(res.status === 206 || res.status === 200) || !res.body) {
    failWorkflow(`Failed to fetch blob chunk by range; status: ${res.status}`)
  }

  return await res.arrayBuffer()
}

/**
 * Helper function to count the number of new lines in a buffer.
 */
const countNewLinesInBuffer = (buffer: Buffer): number => {
  let count = 0
  for (let i = 0; i < buffer.length; i++) {
    if (buffer[i] === 0x0a) {
      count++
    }
  }
  return count
}

/**
 * Helper to trim a fetched byte range to full lines.
 */
const trimChunkBufferToRowBoundary = ({
  buffer,
  rangeStart,
  rangeEndExclusive,
  totalByteSize,
}: {
  buffer: Buffer<ArrayBuffer>
  rangeStart: number
  rangeEndExclusive: number
  totalByteSize: number
}): { buffer: Buffer<ArrayBuffer>; consumed: number } => {
  const isLastChunk = rangeEndExclusive === totalByteSize - 1
  const consumed = buffer.length

  if (isLastChunk) {
    return { buffer, consumed }
  }

  const lastNewLine = buffer.lastIndexOf('\n')
  if (lastNewLine < 0) {
    failWorkflow(
      `Chunk has no newline; row exceeds chunk size at cursor ${rangeStart}`
    )
  }

  return {
    buffer: buffer.subarray(0, lastNewLine + 1),
    consumed: lastNewLine + 1,
  }
}

/**
 * Mark the contact import as failed by:
 *  - appending the error entry to the contact import.
 *  - updating the ingestion status and completed at timestamp.
 *  - emitting a done event to the realtime channel.
 */
async function markImportAsFailed({
  importId,
  message,
}: {
  importId: string
  message: string
}): Promise<void> {
  // Truncate the message to 8000 characters to avoid PostgreSQL's text limit.
  const trimmed = message.slice(0, 8000)

  await appendImportErrorEntries({
    importId,
    entries: [{ kind: 'fatal', message: trimmed }],
  })
  await db
    .update(contactImports)
    .set({
      ingestionStatus: 'failed',
      completedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(eq(contactImports.id, importId))
}

/**
 * Plan the import chunks for a given contact import.
 */
async function planChunks({
  importId,
}: {
  importId: string
}): Promise<{ chunkCount: number; status: 'created' | 'skipped' }> {
  'use step'

  const [job] = await db
    .select({
      blobUrl: contactImports.blobUrl,
      totalByteSize: contactImports.totalByteSize,
    })
    .from(contactImports)
    .where(eq(contactImports.id, importId))
    .limit(1)

  if (!job) {
    failWorkflow('Contact import not found')
  }

  const existing = await db
    .select({ chunkIndex: contactImportChunks.chunkIndex })
    .from(contactImportChunks)
    .where(eq(contactImportChunks.importId, importId))
    .limit(1)

  /**
   * Check idempotency of the chunk planning.
   * If one chunk already exists then we can skip the chunk planning
   * and reuse the the existing plan.
   *
   * Important in case of Vercel workflow make retries or replays
   * after a transient failure, or the orchestrator re-executing the workflow.
   *
   * It also avoids to get duplicate key failures in the db.
   */
  if (existing.length > 0) {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contactImportChunks)
      .where(eq(contactImportChunks.importId, importId))

    return { chunkCount: count, status: 'skipped' }
  }

  let cursor = 0
  let chunkIndex = 0
  let firstRowNumber = 1

  const importChunks: CreateContactImportChunk[] = []

  while (cursor < job.totalByteSize) {
    const rangeStart = cursor
    const rangeEndExclusive = Math.min(
      cursor + CHUNK_SIZE - 1,
      job.totalByteSize - 1
    )

    const chunkAsArrayBuffer = await fetchBlobChunkByRange({
      url: job.blobUrl,
      start: rangeStart,
      end: rangeEndExclusive,
    })

    let buffer = Buffer.from(chunkAsArrayBuffer)
    const { buffer: trimmedBuffer, consumed } = trimChunkBufferToRowBoundary({
      buffer,
      rangeStart,
      rangeEndExclusive,
      totalByteSize: job.totalByteSize,
    })
    buffer = trimmedBuffer

    const byteEndExclusive = rangeStart + consumed
    const newLineCount = countNewLinesInBuffer(buffer)

    importChunks.push({
      importId,
      chunkIndex,
      byteStart: rangeStart,
      byteEndExclusive,
      firstRowNumber,
      status: 'pending',
    })

    firstRowNumber += newLineCount
    cursor = byteEndExclusive
    chunkIndex += 1
  }

  if (importChunks.length > 0) {
    await markImportAsFailed({ importId, message: 'Failed to plan chunks' })
    return failWorkflow('Failed to plan chunks')
  }

  await db.insert(contactImportChunks).values(importChunks)

  return { chunkCount: importChunks.length, status: 'created' }
}

/**
 * Prepare the import by fetching the blob size and updating the contact import record.
 */
async function prepareImport({
  importId,
}: {
  importId: string
}): Promise<void> {
  'use step'

  const [job] = await db
    .select({
      blobUrl: contactImports.blobUrl,
      totalByteSize: contactImports.totalByteSize,
      ingestionStatus: contactImports.ingestionStatus,
    })
    .from(contactImports)
    .where(eq(contactImports.id, importId))
    .limit(1)

  if (!job) {
    failWorkflow('Contact import not found')
  }

  /** If the blob size is already fetched, skip */
  if (job.totalByteSize !== 0) {
    return
  }

  const totalByteSize = await fetchBlobSize({ blobUrl: job.blobUrl })
  if (!Number.isFinite(totalByteSize) || totalByteSize <= 0) {
    await markImportAsFailed({
      importId,
      message: `Blob size is not valid: ${totalByteSize}`,
    })
    return failWorkflow(`Blob size is not valid: ${totalByteSize}`)
  }

  await db
    .update(contactImports)
    .set({
      totalByteSize,
      updatedAt: sql`now()`,
    })
    .where(eq(contactImports.id, importId))
}

/**
 * Neon HTTP driver has **no interactive transactions**. Each Drizzle call is one round-trip;
 * PostgreSQL still executes each multi-row `INSERT` as a single atomic statement.
 *
 * Order per batch:
 * 1. Upsert contacts → `RETURNING id`
 * 2. Attach returned IDs to the list (`ON CONFLICT DO NOTHING` keeps retries safe).
 *
 * If step 2 fails transiently, re-running the batch repeats step 1 idempotently and finishes memberships.
 *
 * Idempotency under chunk retry:
 *  - `ingestContactImportChunk` is itself a `'use step'` Workflow and it may replay an entire
 *   chunk on transient failure.
 *  - The contacts upsert is row-idempotent (`ON CONFLICT DO
 *   UPDATE`); memberships are skip-on-conflict. Counters increment in `ingestContactImportChunk`
 *   per chunk, so a chunk that succeeds halfway and then retries can double-count up to
 *   one `BATCH_UPSERT_SIZE` worth of rows in the counters. That drift is acceptable because the
 *   underlying contact rows are correct and the cursor advances only on full chunk success.
 */
async function flushBatch({
  importId,
  tenantId,
  listId,
  rows,
}: {
  importId: string
  tenantId: string
  listId: string
  rows: MappedContactImportRow[]
}): Promise<{ committed: number }> {
  if (rows.length === 0) {
    return { committed: 0 }
  }

  const dedupedByNormalizedEmail = new Map<string, MappedContactImportRow>()
  for (const row of rows) {
    dedupedByNormalizedEmail.set(row.email.toLowerCase(), row)
  }

  const uniqueRows = [...dedupedByNormalizedEmail.values()]

  try {
    const upsertedContacts = await db
      .insert(contacts)
      .values(
        uniqueRows.map((r) => ({
          tenantId,
          email: r.email,
          firstName: r.firstName,
          lastName: r.lastName,
          varyingFields: r.varyingFields,
          completedAt: sql`now()`,
        }))
      )
      .onConflictDoUpdate({
        target: [contacts.tenantId, contacts.emailNormalized],
        set: {
          firstName: sql`excluded.first_name`,
          lastName: sql`excluded.last_name`,
          varyingFields: sql`excluded.varying_fields`,
          updatedAt: sql`now()`,
        },
      })
      .returning({ id: contacts.id })

    if (upsertedContacts.length > 0) {
      await db
        .insert(contactsListMembers)
        .values(
          upsertedContacts.map((row) => ({
            listId,
            contactId: row.id,
          }))
        )
        .onConflictDoNothing()
    }

    return { committed: upsertedContacts.length }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await markImportAsFailed({
      importId,
      message: `Failed to upsert contacts: ${message}`,
    })

    return failWorkflow(`Failed to upsert contacts: ${message}`)
  }
}

type ChunkSkipSample = { rowNumber: number; reason: string }
type ChunkIngestResult = {
  chunkIndex: number
  numberOfInspectedRows: number
  numberOfIngestedRows: number
  numberOfSkippedRows: number
  skipSamples: ChunkSkipSample[]
  byteEndExclusive: number
}

/**
 * Get the chunk boundaries for a given chunk index.
 */
async function getChunkBoundaries({
  importId,
  chunkIndex,
}: {
  importId: string
  chunkIndex: number
}): Promise<ContactImportChunk | null> {
  const [contactImportChunk] = await db
    .select()
    .from(contactImportChunks)
    .where(
      and(
        eq(contactImportChunks.importId, importId),
        eq(contactImportChunks.chunkIndex, chunkIndex)
      )
    )
    .limit(1)

  if (!contactImportChunk) {
    return null
  }

  return contactImportChunk
}

/**
 * Ingest a chunk and insert rows into the db.
 * Inserts are also batched to avoid too many round-trips to the db.
 */
async function ingestChunk({
  importId,
  chunkIndex,
}: {
  importId: string
  chunkIndex: number
}): Promise<ChunkIngestResult> {
  'use step'

  const [job] = await db
    .select()
    .from(contactImports)
    .where(eq(contactImports.id, importId))
    .limit(1)

  // If the contact import is not found, we consider the import as failed.
  if (!job) {
    return failWorkflow('Contact import not found')
  }

  const chunk = await getChunkBoundaries({ importId, chunkIndex })
  if (!chunk) {
    await markImportAsFailed({
      importId,
      message: `Chunk "${chunkIndex}" not found`,
    })
    return failWorkflow(`Chunk "${chunkIndex}" not found`)
  }

  if (chunk.status === 'completed') {
    return {
      chunkIndex,
      numberOfInspectedRows: chunk.numberOfInspectedRows,
      numberOfIngestedRows: chunk.numberOfIngestedRows,
      numberOfSkippedRows: chunk.numberOfSkippedRows,
      skipSamples: [],
      byteEndExclusive: chunk.byteEndExclusive,
    }
  }

  const rangeStart = chunk.byteStart
  const rangeEndExclusive = chunk.byteEndExclusive - 1

  const isFirstChunk = rangeStart === 0
  const isLastChunk = chunk.byteEndExclusive >= job.totalByteSize

  const chunkAsArrayBuffer = await fetchBlobChunkByRange({
    url: job.blobUrl,
    start: rangeStart,
    end: rangeEndExclusive,
  })

  let buffer = Buffer.from(chunkAsArrayBuffer)

  /**
   * Begin defensive here as in this condition the plan already
   * stored row-aligned end. We trim again only if the blob changed
   */
  if (buffer.length > 0 && !isLastChunk) {
    const lastNewLine = buffer.lastIndexOf('\n')
    if (lastNewLine < 0) {
      await markImportAsFailed({
        importId,
        message: `Chunk has no newline at byte ${rangeStart}`,
      })
      return failWorkflow(`Chunk has no newline at byte ${rangeStart}`)
    }
    buffer = buffer.subarray(0, lastNewLine + 1)
  }

  /**
   * Inlining the column headers from the column mapping
   * to map the parsed CSV records to the contact import row.
   */
  const columnHeaders = columnMappingRefsByIndex(job.columnMap).map(
    (c) => c.value
  )

  const parser = parse({
    columns: columnHeaders,
    skip_empty_lines: true,
    trim: true,
    bom: isFirstChunk,
    relax_column_count: true,
  })

  const pipe = Readable.from(buffer).pipe(parser)

  let batch: MappedContactImportRow[] = []

  let numberOfInspectedRows = 0
  let numberOfIngestedRows = 0
  let numberOfSkippedRows = 0

  const skipSamples: ChunkSkipSample[] = []

  /**
   * Flush the batch to the database and reset the batch.
   */
  const $flushBatch = async () => {
    if (batch.length === 0) return
    const { committed } = await flushBatch({
      importId,
      tenantId: job.tenantId,
      listId: job.listId,
      rows: batch,
    })
    numberOfIngestedRows += committed
    batch = []
  }

  for await (const record of pipe as AsyncIterable<Record<string, string>>) {
    numberOfInspectedRows += 1
    const globalRowNumber = chunk.firstRowNumber + numberOfInspectedRows - 1

    const mappedRow = mapContactImportRow({
      record,
      columnMap: job.columnMap,
    })
    /** Rows must have a valid email address. */
    if (mappedRow === null) {
      numberOfSkippedRows += 1
      skipSamples.push({
        rowNumber: globalRowNumber,
        reason: 'Invalid email address',
      })
      continue
    }

    batch.push(mappedRow)
    if (batch.length >= BATCH_UPSERT_SIZE) {
      await $flushBatch()
    }
  }
  await $flushBatch()

  /** Mark chunk completed + store per-chunk counters (idempotent unit of work) */
  const updatedChunks = await db
    .update(contactImportChunks)
    .set({
      status: 'completed',
      numberOfInspectedRows: numberOfInspectedRows,
      numberOfIngestedRows: numberOfIngestedRows,
      numberOfSkippedRows: numberOfSkippedRows,
      completedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(contactImportChunks.importId, importId),
        eq(contactImportChunks.chunkIndex, chunkIndex),
        eq(contactImportChunks.status, 'pending')
      )
    )
    .returning({ chunkIndex: contactImportChunks.chunkIndex })

  /**
   * If the updated affected 0 rows, then we need to re-read the chunk
   * and return early without updating the contact import counters.
   *
   * We fail the workflow is the chunk to not exists or is not completed.
   */
  if (updatedChunks.length === 0) {
    const chunk = await getChunkBoundaries({ importId, chunkIndex })
    if (chunk?.status === 'completed') {
      return {
        chunkIndex,
        numberOfInspectedRows: chunk.numberOfIngestedRows,
        numberOfIngestedRows: chunk.numberOfIngestedRows,
        numberOfSkippedRows: chunk.numberOfSkippedRows,
        skipSamples: [],
        byteEndExclusive: chunk.byteEndExclusive,
      }
    }

    return failWorkflow('Failed to mark chunk as completed')
  }

  /** Single atomic `UPDATE` with incremental counters */
  await db
    .update(contactImports)
    .set({
      numberOfInspectedRows: sql`${contactImports.numberOfInspectedRows} + ${numberOfInspectedRows}`,
      numberOfIngestedRows: sql`${contactImports.numberOfIngestedRows} + ${numberOfIngestedRows}`,
      numberOfSkippedRows: sql`${contactImports.numberOfSkippedRows} + ${numberOfSkippedRows}`,
      updatedAt: sql`now()`,
    })
    .where(eq(contactImports.id, importId))
    .returning({
      totalByteSize: contactImports.totalByteSize,
      numberOfInspectedRows: contactImports.numberOfInspectedRows,
      numberOfIngestedRows: contactImports.numberOfIngestedRows,
      numberOfSkippedRows: contactImports.numberOfSkippedRows,
    })

  return {
    chunkIndex,
    numberOfInspectedRows: numberOfInspectedRows,
    numberOfIngestedRows: numberOfIngestedRows,
    numberOfSkippedRows: numberOfSkippedRows,
    skipSamples,
    byteEndExclusive: chunk.byteEndExclusive,
  }
}

/** Merge the skip errors */
async function mergeSkipErrors({
  importId,
  skipSamples,
}: {
  importId: string
  skipSamples: ChunkSkipSample[]
}): Promise<void> {
  'use step'

  if (skipSamples.length === 0) {
    return
  }

  skipSamples.sort((a, b) => a.rowNumber - b.rowNumber)

  await appendImportErrorEntries({
    importId,
    entries: skipSamples.map((s) => ({
      kind: 'skip',
      rowNumber: s.rowNumber,
      reason: s.reason,
    })),
  })
}

/**
 * Orchestrator to ingest chunks in parallel.
 * It creates a bounded parallel pool of ingestion jobs and processes each planned chunk
 * but with a bounded limit at a time (not all chunk at once).
 *
 * | iteration | start | batch chunks' indices |
 * |-----------|-------|-----------------------|
 * | 1         | 0     | [0, 1, 2, 3]          |
 * | 2         | 4     | [4, 5, 6, 7]          |
 * | 3         | 8     | [8, 9, 10, 11]        |
 * | ...       | ...   | ...                   |
 * | n         | ...   | [...n-1, n]           |
 */
async function ingestChunks({
  importId,
  chunkCount,
}: {
  importId: string
  chunkCount: number
}): Promise<{ skipSamples: ChunkSkipSample[] }> {
  const skipSamples: ChunkSkipSample[] = []

  for (let start = 0; start < chunkCount; start += PARALLEL_CHUNK_LIMIT) {
    const end = Math.min(start + PARALLEL_CHUNK_LIMIT, chunkCount)
    const chunksIndices = Array.from(
      { length: end - start },
      (_, i) => start + i
    )

    const promises = chunksIndices.map((chunkIndex) =>
      ingestChunk({ importId, chunkIndex })
    )
    const ingestions = await Promise.all(promises)

    for (const ingestion of ingestions) {
      skipSamples.push(...ingestion.skipSamples)
    }
  }

  return { skipSamples }
}

/** Complete the contact import by marking it as completed. */
async function completeImport({
  importId,
}: {
  importId: string
}): Promise<void> {
  'use step'

  const [job] = await db
    .update(contactImports)
    .set({
      ingestionStatus: 'completed',
      completedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(eq(contactImports.id, importId))
    .returning({
      columnMap: contactImports.columnMap,
      listId: contactImports.listId,
    })

  if (!job) {
    failWorkflow('Contact import not found while completing')
  }

  await db
    .update(contactsLists)
    .set({
      columnMap: job.columnMap,
    })
    .where(
      and(eq(contactsLists.id, job.listId), isNull(contactsLists.deletedAt))
    )
}

export async function contactImportWorkflow({
  importId,
}: {
  importId: string
}) {
  'use workflow'

  try {
    // 1️⃣ Let's prepare the import by fetching the blob size and update the record in the db.
    await prepareImport({ importId })

    // 2️⃣ Let's plan the chunks to ingest.
    const { chunkCount, status } = await planChunks({ importId })
    if (status === 'skipped') {
      console.log(`Planning skipped for import ${importId}`)
    }

    // 3️⃣ Let's ingest the chunks in parallel.
    const { skipSamples } = await ingestChunks({ importId, chunkCount })
    if (skipSamples.length > 0) {
      await mergeSkipErrors({ importId, skipSamples })
    }

    // 4️⃣ Let's complete the import by marking it as completed.
    await completeImport({ importId })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    await markImportAsFailed({ importId, message })

    throw err
  }
}
