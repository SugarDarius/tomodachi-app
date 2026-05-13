'use client'

import {
  object,
  array,
  number,
  boolean,
  string,
  flexDate,
  nullable,
  record,
} from 'decoders'
import { useQueryState, parseAsInteger, parseAsString } from 'nuqs'
import { useEffect } from 'react'

import { type ColumnMapping, type Contact } from '~/schema'
import { useSafeSWR, preloadSafeSWR } from '~/hooks/use-safe-swr'
import { useDebounce } from '~/hooks/use-debounce'

import { type ContactsListMembersPage } from '../_lib/contacts-list'

import { DEFAULT_PAGE_INDEX, DEFAULT_PAGE_SIZE } from '../_lib/constants'

const paginatedContactsListDecoder = object({
  contacts: array(
    object({
      id: string,
      tenantId: string,
      email: string,
      emailNormalized: nullable(string),
      firstName: string,
      lastName: string,
      varyingFields: record(string, string),
      createdAt: flexDate,
      updatedAt: flexDate,
      deletedAt: nullable(flexDate),
    })
  ).refineType<Contact[]>(),
  columnMap: object({
    canonical: object({
      email: object({ value: string, positionIndex: number }),
      first_name: object({ value: string, positionIndex: number }),
      last_name: object({ value: string, positionIndex: number }),
    }),
    varying: array(object({ value: string, positionIndex: number })),
  }).refineType<ColumnMapping>(),
  totalCount: number,
  pageIndex: number,
  pageSize: number,
  totalPages: number,
  canGoNext: boolean,
  canGoPrevious: boolean,
}).refineType<ContactsListMembersPage>()

/**
 * Custom hook to handle client-side hydration of the data with
 * - pagination (shareable in the URL state)
 * - search query (debounced / shareable in the URL state)
 * - data preloading (to avoid flickering)
 */
export function usePaginatedContactsList({
  listId,
  initialPage,
  initialPageIndex = DEFAULT_PAGE_INDEX,
  initialSearchQuery = '',
  onPageChange,
}: {
  listId: string
  initialPage: ContactsListMembersPage
  initialPageIndex?: number
  initialSearchQuery?: string
  onPageChange?: () => void
}) {
  const [pageIndex, setPageIndex] = useQueryState(
    'page',
    parseAsInteger.withDefault(initialPageIndex)
  )
  const [searchQuery, setSearchQuery] = useQueryState(
    'search',
    parseAsString.withDefault(initialSearchQuery)
  )

  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  const {
    data: page,
    error,
    mutate,
  } = useSafeSWR<ContactsListMembersPage>(
    `/api/contacts/get/${listId}?pageIndex=${pageIndex}&pageSize=${DEFAULT_PAGE_SIZE}&searchQuery=${debouncedSearchQuery}`,
    paginatedContactsListDecoder,
    {
      initialData: initialPage,
      revalidateOnFocus: true,
      // 👇🏻 Refresh interval to keep the data fresh (every 10 seconds)
      // for such a use case like csv import 10s is very fair enough.
      refreshInterval: 10 * 1000,
    }
  )

  const handleNext = () => {
    if (page.canGoNext) {
      setPageIndex(pageIndex + 1)
      onPageChange?.()
    }
  }

  const handlePrevious = () => {
    if (page.canGoPrevious) {
      setPageIndex(pageIndex - 1)
      onPageChange?.()
    }
  }

  const handleRefresh = () => {
    mutate()
  }

  const handleUpdateSearchQuery = (query: string) => {
    setSearchQuery(query)
  }

  useEffect(() => {
    if (page.canGoNext) {
      preloadSafeSWR(
        `/api/contacts/get/${listId}?pageIndex=${pageIndex + 1}&pageSize=${DEFAULT_PAGE_SIZE}`,
        paginatedContactsListDecoder
      )
    }
  }, [page.canGoNext, listId, pageIndex])

  return {
    error,
    page,
    searchQuery,
    handleNext,
    handlePrevious,
    handleRefresh,
    handleUpdateSearchQuery,
    canGoNext: page.canGoNext,
    canGoPrevious: page.canGoPrevious,
  }
}
