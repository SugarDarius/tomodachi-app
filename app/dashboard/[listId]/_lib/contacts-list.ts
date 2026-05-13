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
  type ColumnMapping,
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
  columnMap: ColumnMapping
  totalCount: number
  pageIndex: number
  pageSize: number
  totalPages: number
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
  searchQuery?: string
}): Promise<ContactsListMembersPage> {
  const $pageIndex = Math.max(1, Math.floor(pageIndex))
  const $pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(pageSize)))

  const [countRowResult, contactsPage, list] = await Promise.all([
    db
      .select({ totalCount: count() })
      .from(contactsListMembers)
      .where(eq(contactsListMembers.listId, id)),
    db
      .select(getTableColumns(contacts))
      .from(contactsListMembers)
      .innerJoin(contacts, eq(contactsListMembers.contactId, contacts.id))
      .where(eq(contactsListMembers.listId, id))
      // 👇🏻 Pagination tie breaker to ensure consistent pagination
      .orderBy(
        desc(contactsListMembers.addedAt),
        desc(contactsListMembers.contactId)
      )
      .limit($pageSize)
      .offset(($pageIndex - 1) * $pageSize),
    db
      .select({ columnMap: contactsLists.columnMap })
      .from(contactsLists)
      .where(eq(contactsLists.id, id))
      .limit(1),
  ])

  const totalCount = Number(countRowResult[0]?.totalCount ?? 0)
  return {
    contacts: contactsPage,
    columnMap: list[0]?.columnMap ?? {
      canonical: {
        email: { value: 'email', positionIndex: 0 },
        first_name: { value: 'firstName', positionIndex: 1 },
        last_name: { value: 'lastName', positionIndex: 2 },
      },
      varying: [],
    },
    totalCount,
    pageIndex: $pageIndex,
    canGoNext: $pageIndex * $pageSize < totalCount,
    totalPages: Math.ceil(totalCount / $pageSize),
    canGoPrevious: $pageIndex > 1,
    pageSize: $pageSize,
  }
}
