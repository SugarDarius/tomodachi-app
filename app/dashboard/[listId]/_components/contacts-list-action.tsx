import { MoreVertical } from 'lucide-react'

import { Button } from '~/components/ui/button'
import { Skeleton } from '~/components/ui/skeleton'
import { ContactListActionsMenu } from '~/components/contacts-lists/contact-list-actions-menu'

import { getContactsList } from '../_lib/contacts-list'

export const ContactsListActionSkeleton = () => <Skeleton className='size-8' />

export async function ContactsListAction({ listId }: { listId: string }) {
  const list = await getContactsList({ id: listId })

  if (list === null) {
    return null
  }

  return (
    <ContactListActionsMenu list={list} side='bottom' align='end'>
      <Button size='icon' variant='secondary'>
        <MoreVertical className='size-4' />
      </Button>
    </ContactListActionsMenu>
  )
}
