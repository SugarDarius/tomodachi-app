import 'server-only'
import { count, desc, eq, getTableColumns, isNull, and } from 'drizzle-orm'

import { db } from '~/lib/db'
import {
  Contact,
  contacts,
  contactsListMembers,
  contactsLists,
  type ContactsList,
} from '~/schema'

/**
 * Simpler server function to get a single contacts list by its ID.
 */
export async function getContactsList({
  id,
}: {
  id: string
}): Promise<ContactsList | null> {
  const list = await db
    .select()
    .from(contactsLists)
    .where(and(eq(contactsLists.id, id), isNull(contactsLists.deletedAt)))

  if (list.length <= 0) {
    return null
  }

  return list[0]
}

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

export type ContactsListMembersPage = {
  contacts: Contact[]
  totalCount: number
  page: number
  pageSize: number
}

/**
 * Server function to get one page of contacts in a list (newest membership first).
 */
export async function getContactsListMembers({
  id,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
}: {
  id: string
  page?: number
  pageSize?: number
}): Promise<ContactsListMembersPage> {
  const $page = Math.max(1, Math.floor(page))
  const $pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(pageSize)))

  const [countRowResult, contactsPage] = await Promise.all([
    db
      .select({ totalCount: count() })
      .from(contactsListMembers)
      .where(eq(contactsListMembers.listId, id)),
    db
      .select(getTableColumns(contacts))
      .from(contactsListMembers)
      .innerJoin(contacts, eq(contactsListMembers.contactId, contacts.id))
      .where(eq(contactsListMembers.listId, id))
      .orderBy(desc(contactsListMembers.addedAt))
      .limit($pageSize)
      .offset(($page - 1) * $pageSize),
  ])

  const totalCount = Number(countRowResult[0]?.totalCount ?? 0)
  return {
    contacts: contactsPage,
    totalCount,
    page: $page,
    pageSize: $pageSize,
  }
}
