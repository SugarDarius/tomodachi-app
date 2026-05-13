import 'server-only'
import { cacheTag } from 'next/cache'

import { asc, count, eq, getTableColumns, isNull } from 'drizzle-orm'

import { db } from '~/lib/db'
import { contactsListMembers, contactsLists, type ContactsList } from '~/schema'

export type ContactsListWithMEta = ContactsList & {
  meta: {
    contactCount: number
  }
}

/**
 * Simple server function to get all contacts lists.
 */
export async function getContactsLists(): Promise<ContactsListWithMEta[]> {
  'use cache'
  cacheTag('contacts-lists')

  const lists = await db
    .select({
      ...getTableColumns(contactsLists),
      contactCount: count(contactsListMembers.contactId),
    })
    .from(contactsLists)
    .leftJoin(
      contactsListMembers,
      eq(contactsLists.id, contactsListMembers.listId)
    )
    .where(isNull(contactsLists.deletedAt))
    .groupBy(contactsLists.id)
    .orderBy(asc(contactsLists.createdAt))

  return lists.map((row) => {
    return {
      ...row,
      meta: {
        createdBy: '',
        contactCount: Number(row.contactCount ?? 0),
      },
    }
  })
}
