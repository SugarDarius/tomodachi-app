'use client'

import { Pencil, Trash2 } from 'lucide-react'

import { type ContactsList } from '~/schema'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

import { RenameContactListDialog } from './rename-contact-list-dialog'
import { DeleteContactListDialog } from './delete-contact-list-dialog'

export function ContactListActionsMenu({
  list,
  children,
}: {
  list: ContactsList
  children: React.ReactNode
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        side='right'
        align='start'
        className='min-w-40'
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <RenameContactListDialog list={list}>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault()
            }}
          >
            <Pencil className='size-4' />
            Rename
          </DropdownMenuItem>
        </RenameContactListDialog>
        <DropdownMenuSeparator />
        <DeleteContactListDialog list={list}>
          <DropdownMenuItem
            variant='destructive'
            onSelect={(e) => {
              e.preventDefault()
            }}
          >
            <Trash2 className='size-4' />
            Delete
          </DropdownMenuItem>
        </DeleteContactListDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
