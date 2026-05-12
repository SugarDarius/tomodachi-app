import { Skeleton } from '~/components/ui/skeleton'

import { getContactsListMembersPaginated } from '../_lib/contacts-list'
import { ContactsTable } from './contacts-table'

export const ContactsTableSkeleton = () => <Skeleton className='w-full h-18' />

export async function ContactsTableSuspense({
  params,
}: {
  params: Promise<{ listId: string }>
}) {
  const { listId } = await params
  const initialPage = await getContactsListMembersPaginated({ id: listId })

  return <ContactsTable listId={listId} initialPage={initialPage} />
}
