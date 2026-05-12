import { Skeleton } from '~/components/ui/skeleton'

import { getContactsList } from '../_lib/contacts-list'
import { ContactsListPageActionMenuButton } from './contact-list-action-menu-button'

export const ContactsListActionSkeleton = () => <Skeleton className='size-8' />

export async function ContactsListActionSuspense({
  params,
}: {
  params: Promise<{ listId: string }>
}) {
  const { listId } = await params
  const list = await getContactsList({ id: listId })

  if (list === null) {
    return null
  }

  return <ContactsListPageActionMenuButton list={list} />
}
