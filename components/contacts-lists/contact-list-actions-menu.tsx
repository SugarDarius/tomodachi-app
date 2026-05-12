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
  side = 'right',
  align = 'start',
  children,
}: {
  list: ContactsList
  side?: React.ComponentProps<typeof DropdownMenuContent>['side']
  align?: React.ComponentProps<typeof DropdownMenuContent>['align']
  children: React.ReactNode
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        side={side}
        align={align}
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
