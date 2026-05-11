import { Readable } from 'node:stream'
import { head } from '@vercel/blob'

import { FatalError } from 'workflow'
import { parse } from 'csv-parse'

import { eq, sql } from 'drizzle-orm'

import { db } from '~/lib/db'
import {
  contacts,
  contactImports,
  type ContactImportErrorEntry,
  CONTACT_IMPORT_ERRORS_CAPACITY,
  contactsListMembers,
} from '~/schema'
import {
  emitContactImportDone,
  emitContactImportTick,
} from '~/lib/realtime-emit-workflow'
import { columnMappingRefsByIndex } from '~/lib/csv/columns'
import {
  mapContactImportRow,
  type MappedContactImportRow,
} from '~/lib/csv/rows'
import { env } from 'node:process'

/* fail the workflow explcitly with a `FatalError` */
const failWorkflow = (message: string): never => {
  throw new FatalError(message)
}

/**
 * Append error entries to the contact import.
 */
async function appendContactImportErrorEntries({
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
 * Mark the contact import as failed by:
 *  - appending the error entry to the contact import.
 *  - updating the ingestion status and completed at timestamp.
 *  - emitting a done event to the realtime channel.
 */
async function markContactImportAsFailed({
  importId,
  message,
}: {
  importId: string
  message: string
}): Promise<void> {
  // Truncate the message to 8000 characters to avoid PostgreSQL's text limit.
  const trimmed = message.slice(0, 8000)

  await appendContactImportErrorEntries({
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

  await emitContactImportDone({
    importId,
    payload: { ingestionStatus: 'failed', lastError: trimmed },
  })
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
 * Prepare the contact import by fetching the blob size and updating the contact import record.
 */
async function prepareContactImport({
  importId,
}: {
  importId: string
}): Promise<{ status: 'updated' | 'skipped' }> {
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

  if (job.totalByteSize !== 0) {
    // Blob size already fetched, skip
    return { status: 'skipped' }
  }

  const totalByteSize = await fetchBlobSize({ blobUrl: job.blobUrl })
  if (!Number.isFinite(totalByteSize) || totalByteSize <= 0) {
    failWorkflow(`Blob size is not valid: ${totalByteSize}`)
  }

  await db
    .update(contactImports)
    .set({
      totalByteSize,
      updatedAt: sql`now()`,
    })
    .where(eq(contactImports.id, importId))

  return { status: 'updated' }
}

/**
 * The size of the chunk to ingest.
 * 4Mb is empirically the sweet spot for 10k to 40k rows
 * to ingest with speed and memory efficiency.
 */
const CHUNK_SIZE = 1024 * 1024 * 4

/**
 * Fetch a chunk of the blob by range.
 */
const fetchBlobChunkByRange = async ({
  blobUrl,
  rangeStart,
  rangeEnd,
}: {
  blobUrl: string
  rangeStart: number
  rangeEnd: number
}): Promise<ArrayBuffer> => {
  const res = await fetch(blobUrl, {
    headers: {
      Range: `bytes=${rangeStart}-${rangeEnd}`,
      Authorization: `Bearer ${env.BLOB_READ_WRITE_TOKEN}`,
    },
  })

  if (!(res.status === 206 || res.status === 200) || !res.body) {
    failWorkflow(`Failed to fetch blob chunk by range; status: ${res.status}`)
  }

  return await res.arrayBuffer()
}

/**
 * The size of the batch to upsert contacts.
 */
const BATCH_SIZE = 1000

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
 *   one `BATCH_SIZE` worth of rows in the counters. That drift is acceptable because the
 *   underlying contact rows are correct and the cursor advances only on full chunk success.
 */
async function flushContactImportBatch({
  tenantId,
  listId,
  rows,
}: {
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

  const upsertedContacts = await db
    .insert(contacts)
    .values(
      uniqueRows.map((r) => ({
        tenantId,
        email: r.email,
        firstName: r.firstName,
        lastName: r.lastName,
        varyingFields: r.varyingFields,
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
}
/**
 * Ingest a chunk of the contact import.
 *
 * Defines the chunk range to ingest and the cursor byte to update.
 */
async function ingestContactImportChunk({
  importId,
}: {
  importId: string
}): Promise<{ done: boolean }> {
  'use step'
  const [job] = await db
    .select()
    .from(contactImports)
    .where(eq(contactImports.id, importId))
    .limit(1)

  // If the contact import is not found, we consider the import as done.
  if (!job) {
    return { done: true }
  }

  if (job.totalByteSize === null) {
    failWorkflow('Contact import not prepared')
  }

  // If the cursor byte is greater than or equal to the total byte size,
  // then we can consider the import as done.
  if (job.cursorByte >= job.totalByteSize) {
    return { done: true }
  }

  const isFirstChunk = job.cursorByte === 0

  const chunkRangeStart = job.cursorByte
  const chunkRangeEnd = Math.min(
    chunkRangeStart + CHUNK_SIZE - 1,
    job.totalByteSize - 1
  )

  const isLastChunk = chunkRangeEnd === job.totalByteSize - 1

  const chunkAsArrayBuffer = await fetchBlobChunkByRange({
    blobUrl: job.blobUrl,
    rangeStart: chunkRangeStart,
    rangeEnd: chunkRangeEnd,
  })

  let buffer = Buffer.from(chunkAsArrayBuffer)

  // Trim back to the last newline so we never split a row across chunks.
  // (The next chunk's cursor will land on the byte immediately after that newline.)
  let consumed = buffer.length
  if (!isLastChunk) {
    const lastNewLine = buffer.lastIndexOf('\n')
    if (lastNewLine < 0) {
      failWorkflow(
        `Chunk has no newline; row exceeds chunk size at cursor ${chunkRangeStart}`
      )
    }
    buffer = buffer.subarray(0, lastNewLine + 1)
    consumed = lastNewLine + 1
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

  let numberOfInspectedChunk = 0
  let numberOfIngestedChunk = 0
  let numberOfSkippedChunk = 0

  const skipSamples: { rowNumber: number; reason: string }[] = []

  /**
   * Flush the batch to the database and reset the batch.
   */
  const flushBatch = async () => {
    if (batch.length === 0) return
    const { committed } = await flushContactImportBatch({
      tenantId: job.tenantId,
      listId: job.listId,
      rows: batch,
    })
    numberOfIngestedChunk += committed
    batch = []
  }

  for await (const record of pipe as AsyncIterable<Record<string, string>>) {
    numberOfInspectedChunk += 1
    const mappedRow = mapContactImportRow({
      record,
      columnMap: job.columnMap,
    })
    /**
     * Rows must have a valid email address.
     */
    if (mappedRow === null) {
      numberOfSkippedChunk += 1
      skipSamples.push({
        rowNumber: numberOfInspectedChunk,
        reason: 'Invalid email address',
      })
      continue
    }
    batch.push(mappedRow)
    if (batch.length >= BATCH_SIZE) {
      await flushBatch()
    }
  }
  await flushBatch()

  if (skipSamples.length > 0) {
    await appendContactImportErrorEntries({
      importId,
      entries: skipSamples.map((s) => ({
        kind: 'skip',
        rowNumber: s.rowNumber,
        reason: s.reason,
      })),
    })
  }

  /**
   * Single atomic `UPDATE` with incremental counters + advanced cursor.
   * `RETURNING` payload is feeding the realtime tick so the tick reflects
   * the new canonical totals (not in-memory deltas that would reset on replays)
   */
  const [updated] = await db
    .update(contactImports)
    .set({
      cursorByte: chunkRangeStart + consumed,
      numberOfInspectedRows: sql`${contactImports.numberOfInspectedRows} + ${numberOfInspectedChunk}`,
      numberOfIngestedRows: sql`${contactImports.numberOfIngestedRows} + ${numberOfIngestedChunk}`,
      numberOfSkippedRows: sql`${contactImports.numberOfSkippedRows} + ${numberOfSkippedChunk}`,
      updatedAt: sql`now()`,
    })
    .where(eq(contactImports.id, importId))
    .returning({
      cursorByte: contactImports.cursorByte,
      totalByteSize: contactImports.totalByteSize,
      numberOfInspectedRows: contactImports.numberOfInspectedRows,
      numberOfIngestedRows: contactImports.numberOfIngestedRows,
      numberOfSkippedRows: contactImports.numberOfSkippedRows,
    })

  /**
   * Emit a tick event to the realtime channel.
   * The tick event is used to update the client with the progress of the import.
   */
  await emitContactImportTick({
    importId,
    payload: {
      numberOfInspectedRows: numberOfInspectedChunk,
      numberOfIngestedRows: numberOfIngestedChunk,
      numberOfSkippedRows: numberOfSkippedChunk,
      cursorByte: updated.cursorByte,
      totalByteSize: updated.totalByteSize,
      ingestionStatus: job.ingestionStatus,
    },
  })

  return { done: updated.cursorByte >= (updated.totalByteSize ?? 0) }
}

/**
 * Complete the contact import by
 *  - marking it as completed.
 *  - emitting a done event to the realtime channel.
 */
async function completeContactImport({
  importId,
}: {
  importId: string
}): Promise<void> {
  'use step'

  await db
    .update(contactImports)
    .set({
      ingestionStatus: 'completed',
      completedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(eq(contactImports.id, importId))

  await emitContactImportDone({
    importId,
    payload: {
      ingestionStatus: 'completed',
      lastError: null,
    },
  })
}

export async function contactImportWorkflow({
  importId,
}: {
  importId: string
}) {
  'use workflow'

  try {
    await prepareContactImport({ importId })

    /**
     * Ingest the contact import chunk by chunk until the import is done.
     */
    while (true) {
      const { done } = await ingestContactImportChunk({ importId })
      if (done) {
        break
      }
    }

    await completeContactImport({ importId })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    await markContactImportAsFailed({ importId, message })

    throw err
  }
}
