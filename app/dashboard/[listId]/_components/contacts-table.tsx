import { Skeleton } from '~/components/ui/skeleton'

import { getContactsListMembers } from '../_lib/contacts-list'
import { ContactsTableContent } from './contacts-table-content'

export const ContactsTableSkeleton = () => <Skeleton className='w-full h-18' />

export async function ContactsTable({
  params,
}: {
  params: Promise<{ listId: string }>
}) {
  const { listId } = await params
  const initialPage = await getContactsListMembers({ id: listId })

  return <ContactsTableContent listId={listId} initialPage={initialPage} />
}
