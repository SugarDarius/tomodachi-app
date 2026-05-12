'use client'

import { ContactIcon, ArrowLeft, ArrowRight } from 'lucide-react'

import { formatNumberWithCommas } from '~/utils/format-number'
import { cn } from '~/lib/utils'

import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderGroup,
  TableProvider,
  TableRow,
} from '~/components/kibo-ui/table'
import { Button } from '~/components/ui/button'
import { ImportContactsButton } from '~/components/contacts/import-contacts-button'

import { type ContactsListMembersPage } from '../_lib/contacts-list'

import { usePaginatedContactsList } from '../_hooks/use-paginated-contacts-list'
import { useDynamicColumns } from '../_hooks/use-dynamic-columns'

export function ContactsTable({
  listId,
  initialPage,
}: {
  listId: string
  initialPage: ContactsListMembersPage
}) {
  const { page, handlePrevious, handleNext, canGoPrevious, canGoNext } =
    usePaginatedContactsList({ listId, initialPage })
  const columns = useDynamicColumns({ columnMap: page.columnMap })

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
        <div className='w-full h-full overflow-auto'>
          <TableProvider data={page.contacts} columns={columns}>
            <TableHeader>
              {({ headerGroup }) => (
                <TableHeaderGroup
                  headerGroup={headerGroup}
                  key={headerGroup.id}
                >
                  {({ header }) => (
                    <TableHead header={header} key={header.id} />
                  )}
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
                        'text-right': cell.column.id === 'updatedAt',
                      })}
                    />
                  )}
                </TableRow>
              )}
            </TableBody>
          </TableProvider>
        </div>
      </div>
      <div className='flex items-center justify-between p-4 flex-none border-t border-border'>
        <span className='text-sm text-muted-foreground'>
          {page.totalCount === 1
            ? '1 contact'
            : `${formatNumberWithCommas(page.totalCount)} contacts`}
          {page.totalPages > 1
            ? ` in ${formatNumberWithCommas(page.totalPages)} pages`
            : ''}
        </span>
        <div className='flex items-center gap-2'>
          <Button onClick={handlePrevious} size='sm' disabled={!canGoPrevious}>
            <ArrowLeft className='size-4' />
          </Button>
          <span className='text-sm text-muted-foreground'>
            {page.pageIndex} / {page.totalPages}
          </span>
          <Button onClick={handleNext} size='sm' disabled={!canGoNext}>
            <ArrowRight className='size-4' />
          </Button>
        </div>
      </div>
    </div>
  )
}
