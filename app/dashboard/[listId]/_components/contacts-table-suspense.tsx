import { numeric, optional, string } from 'decoders'

import { Skeleton } from '~/components/ui/skeleton'

import { DEFAULT_PAGE_INDEX } from '../_lib/constants'
import { getContactsListMembersPaginated } from '../_lib/contacts-list'

import { ContactsTable } from './contacts-table'

export const ContactsTableSkeleton = () => (
  <div className='flex flex-col gap-2 flex-1'>
    <Skeleton className='w-full h-8' />
    <Skeleton className='w-full h-8' />
    <Skeleton className='w-full h-8' />
    <Skeleton className='w-full h-8' />
    <Skeleton className='w-full h-8' />
    <Skeleton className='w-full h-8' />
    <Skeleton className='w-full h-8' />
    <Skeleton className='w-full h-8' />
    <Skeleton className='w-full h-8' />
  </div>
)

export async function ContactsTableSuspense({
  params,
  searchParams,
}: {
  params: Promise<{ listId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { listId } = await params
  const { page, search } = await searchParams

  const decodedPage = numeric.decode(page)
  const pageIndex = decodedPage.ok ? decodedPage.value : DEFAULT_PAGE_INDEX

  const decodedSearch = optional(string).decode(search)
  const searchQuery = decodedSearch.ok ? decodedSearch.value : undefined

  const initialPage = await getContactsListMembersPaginated({
    id: listId,
    pageIndex,
    searchQuery,
  })

  return (
    <ContactsTable
      listId={listId}
      initialPage={initialPage}
      initialSearchQuery={searchQuery}
    />
  )
}
