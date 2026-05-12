'use client'

import { ContactIcon } from 'lucide-react'

import { type Contact } from '~/schema'

import { formatDateAsEnUs } from '~/utils/format-date'
import { cn } from '~/lib/utils'

import {
  type ColumnDef,
  TableBody,
  TableCell,
  TableColumnHeader,
  TableHead,
  TableHeader,
  TableHeaderGroup,
  TableProvider,
  TableRow,
} from '~/components/kibo-ui/table'
import { ImportContactsButton } from '~/components/contacts/import-contacts-button'

import { type ContactsListMembersPage } from '../_lib/contacts-list'
import { usePaginatedContactsList } from '../_hooks/use-paginated-contacts-list'

export function ContactsTable({
  listId,
  initialPage,
}: {
  listId: string
  initialPage: ContactsListMembersPage
}) {
  const { page } = usePaginatedContactsList({ listId, initialPage })
  // TODO: add specific hook for columns definition
  const columns: ColumnDef<Contact>[] = [
    {
      id: 'email',
      accessorKey: 'email',
      header: ({ column }) => (
        <TableColumnHeader column={column} title='Email' />
      ),
    },
    {
      id: 'firstName',
      accessorKey: 'firstName',
      header: ({ column }) => (
        <TableColumnHeader column={column} title='First Name' />
      ),
    },
    {
      id: 'lastName',
      accessorKey: 'lastName',
      header: ({ column }) => (
        <TableColumnHeader column={column} title='Last Name' />
      ),
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <TableColumnHeader
          column={column}
          title='Created At'
          className='justify-end'
        />
      ),
      cell: ({ row }) => formatDateAsEnUs(row.original.createdAt),
    },
  ]

  if (page.totalCount === 0) {
    return (
      <div className='flex flex-col gap-2 flex-1 items-center justify-center'>
        <div className='flex flex-col gap-2 items-center justify-center'>
          <ContactIcon className='size-10' />
          <ImportContactsButton listId={listId} />
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-2 flex-1 overflow-hidden'>
      <div className='flex-1 overflow-hidden'>
        <TableProvider
          data={page.contacts}
          columns={columns}
          className='w-full h-full overflow-auto'
        >
          <TableHeader>
            {({ headerGroup }) => (
              <TableHeaderGroup headerGroup={headerGroup} key={headerGroup.id}>
                {({ header }) => <TableHead header={header} key={header.id} />}
              </TableHeaderGroup>
            )}
          </TableHeader>
          <TableBody>
            {({ row }) => (
              <TableRow key={row.id} row={row} className='cursor-pointer'>
                {({ cell }) => (
                  <TableCell
                    cell={cell}
                    key={cell.id}
                    className={cn({
                      'text-right': cell.column.id === 'createdAt',
                    })}
                  />
                )}
              </TableRow>
            )}
          </TableBody>
        </TableProvider>
      </div>
      <div className='flex items-center justify-between p-4 flex-none'></div>
    </div>
  )
}
