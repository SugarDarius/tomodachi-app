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
import { useState } from 'react'

import { type Contact } from '~/schema'
import { useSafeSWR } from '~/hooks/use-safe-swr'

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
  totalCount: number,
  pageIndex: number,
  pageSize: number,
  canGoNext: boolean,
  canGoPrevious: boolean,
}).refineType<ContactsListMembersPage>()

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

  const {
    data: page,
    error,
    mutate,
  } = useSafeSWR<ContactsListMembersPage>(
    `/api/contacts/get/${listId}?pageIndex=${pageIndex}&pageSize=${DEFAULT_PAGE_SIZE}`,
    paginatedContactsListDecoder,
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
    mutate,
    error,
    page,
    handleNext,
    handlePrevious,
    canGoNext: page.canGoNext,
    canGoPrevious: page.canGoPrevious,
  }
}
