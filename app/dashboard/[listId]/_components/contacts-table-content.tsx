'use client'

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

export function ContactsTableContent({
  initialContacts,
}: {
  initialContacts: Contact[]
}) {
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

  return (
    <TableProvider data={initialContacts} columns={columns}>
      <TableHeader>
        {({ headerGroup }) => (
          <TableHeaderGroup headerGroup={headerGroup} key={headerGroup.id}>
            {({ header }) => <TableHead header={header} key={header.id} />}
          </TableHeaderGroup>
        )}
      </TableHeader>
      <TableBody>
        {({ row }) => (
          <TableRow key={row.id} row={row}>
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
  )
}
