import 'server-only'
import { cacheTag } from 'next/cache'

import { isNull } from 'drizzle-orm'

import { db } from '~/lib/db'
import { contactsLists, type ContactsList } from '~/schema'

/**
 * Simple server function to get all contacts lists.
 */
export async function getContactsLists(): Promise<ContactsList[]> {
  'use cache'
  cacheTag('contacts-lists')

  const lists = await db
    .select()
    .from(contactsLists)
    .where(isNull(contactsLists.deletedAt))
  return lists
}
