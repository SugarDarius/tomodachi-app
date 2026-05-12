'use client'

import { MoreVertical } from 'lucide-react'

import { type ContactsList } from '~/schema'
import { Button } from '~/components/ui/button'

import { ContactListActionsMenu } from '~/components/contacts-lists/contact-list-actions-menu'

export function ContactsListPageActionMenuButton({
  list,
}: {
  list: ContactsList
}) {
  return (
    <ContactListActionsMenu list={list} side='bottom' align='end'>
      <Button size='icon' variant='secondary'>
        <MoreVertical className='size-4' />
      </Button>
    </ContactListActionsMenu>
  )
}
