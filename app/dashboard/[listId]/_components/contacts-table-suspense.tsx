import { Skeleton } from '~/components/ui/skeleton'

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
}: {
  params: Promise<{ listId: string }>
}) {
  const { listId } = await params
  const initialPage = await getContactsListMembersPaginated({ id: listId })

  return <ContactsTable listId={listId} initialPage={initialPage} />
}
