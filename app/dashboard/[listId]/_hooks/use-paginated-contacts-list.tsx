'use client'

import { object, array, unknown, number, boolean } from 'decoders'
import { useState } from 'react'

import { type Contact } from '~/schema'
import { useSafeSWR } from '~/hooks/use-safe-swr'

import { type ContactsListMembersPage } from '../_lib/contacts-list'

import { DEFAULT_PAGE_INDEX, DEFAULT_PAGE_SIZE } from '../_lib/constants'

export function usePaginatedContactsList({
  listId,
  initialPage,
  initialPageIndex = DEFAULT_PAGE_INDEX,
}: {
  listId: string
  initialPage: ContactsListMembersPage
  initialPageIndex?: number
}) {
  const [pageIndex, setPageIndex] = useState(initialPageIndex)
  const { data: page, error } = useSafeSWR<ContactsListMembersPage>(
    `/api/dashboard/contacts/get/${listId}?page=${pageIndex}&pageSize=${DEFAULT_PAGE_SIZE}`,
    object({
      contacts: array(unknown).refineType<Contact[]>(),
      totalCount: number,
      pageIndex: number,
      pageSize: number,
      canGoNext: boolean,
      canGoPrevious: boolean,
    }).refineType<ContactsListMembersPage>(),
    {
      initialData: initialPage,
      revalidateOnFocus: true,
      refreshInterval: 4 * 1000, // 4 seconds
    }
  )

  const handleNext = () => {
    if (page.canGoNext) {
      setPageIndex(pageIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (page.canGoPrevious) {
      setPageIndex(pageIndex - 1)
    }
  }

  return {
    error,
    page,
    handleNext,
    handlePrevious,
  }
}
