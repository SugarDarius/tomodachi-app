import 'server-only'

import { eq, and } from 'drizzle-orm'

import { contactImports, type ContactImportJob } from '~/schema'
import { db } from '~/lib/db'

/**
 * Server function to get a single contact import job by its ID.
 */
export async function getContactImportJob({
  importId,
  listId,
}: {
  importId: string
  listId: string
}): Promise<ContactImportJob | null> {
  const [job] = await db
    .select()
    .from(contactImports)
    .where(
      and(eq(contactImports.id, importId), eq(contactImports.listId, listId))
    )

  if (job === undefined) {
    return null
  }

  return job
}
