import { FatalError } from 'workflow'

import { eq, sql } from 'drizzle-orm'

import { db } from '~/lib/db'
import {
  contactImports,
  type ContactImportErrorEntry,
  CONTACT_IMPORT_ERRORS_CAPACITY,
} from '~/schema'
import { emitContactImportDone } from '~/lib/realtime-emit'

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
        SELECT to_jsonb(arr)
        FROM (
          SELECT array_agg(elem ORDER BY ord)
          FROM (
            SELECT elem, ord
            FROM unnest(
              ARRAY(SELECT jsonb_array_elements(${contactImports.errors})) ||
              ARRAY(SELECT jsonb_array_elements(${incoming}::jsonb))
            ) WITH ORDINALITY AS u(elem, ord)
            ORDER BY ord DESC
            LIMIT ${CONTACT_IMPORT_ERRORS_CAPACITY}
          ) recent
          ORDER BY ord ASC
        ) arr(arr)
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
  const head = await fetch(blobUrl, {
    method: 'HEAD',
  })

  if (!head.ok) {
    failWorkflow('Failed to get blob size')
  }

  return Number(head.headers.get('content-length') ?? 0)
}

/**
 * Prepare the contact import by fetching the blob size and updating the contact import record.
 */
async function prepareContactImport({
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

  if (job.totalByteSize !== null) {
    // Blob size already fetched, skip
    return
  }

  const totalByteSize = await fetchBlobSize({ blobUrl: job.blobUrl })
  if (!Number.isFinite(totalByteSize) || totalByteSize <= 0) {
    failWorkflow('Failed to get blob size')
  }

  await db
    .update(contactImports)
    .set({
      totalByteSize,
      updatedAt: sql`now()`,
    })
    .where(eq(contactImports.id, importId))
}

export async function contactImport({ importId }: { importId: string }) {
  'use workflow'

  try {
    await prepareContactImport({ importId })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    await markContactImportAsFailed({ importId, message: msg })

    throw err
  }
}
