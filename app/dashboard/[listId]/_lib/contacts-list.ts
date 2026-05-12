import 'server-only'
import { cacheTag } from 'next/cache'

import { count, desc, eq, getTableColumns, isNull, and } from 'drizzle-orm'

import { db } from '~/lib/db'
import {
  Contact,
  contacts,
  contactsListMembers,
  contactsLists,
  type ContactsList,
} from '~/schema'
import {
  DEFAULT_PAGE_INDEX,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from './constants'

/**
 * Simpler server function to get a single contacts list by its ID.
 */
export async function getContactsList({
  id,
}: {
  id: string
}): Promise<ContactsList | null> {
  'use cache'
  cacheTag(`contacts-list:${id}`)

  const list = await db
    .select()
    .from(contactsLists)
    .where(and(eq(contactsLists.id, id), isNull(contactsLists.deletedAt)))

  if (list.length <= 0) {
    return null
  }

  return list[0]
}

export type ContactsListMembersPage = {
  contacts: Contact[]
  totalCount: number
  pageIndex: number
  pageSize: number
  canGoNext: boolean
  canGoPrevious: boolean
}

/**
 * Server function to get a paginated page of contacts in a list (newest membership first).
 */
export async function getContactsListMembersPaginated({
  id,
  pageIndex = DEFAULT_PAGE_INDEX,
  pageSize = DEFAULT_PAGE_SIZE,
}: {
  id: string
  pageIndex?: number
  pageSize?: number
}): Promise<ContactsListMembersPage> {
  const $pageIndex = Math.max(1, Math.floor(pageIndex))
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
      .offset(($pageIndex - 1) * $pageSize),
  ])

  const totalCount = Number(countRowResult[0]?.totalCount ?? 0)
  return {
    contacts: contactsPage,
    totalCount,
    pageIndex: $pageIndex,
    canGoNext: $pageIndex * $pageSize < totalCount,
    canGoPrevious: $pageIndex > 1,
    pageSize: $pageSize,
  }
}
