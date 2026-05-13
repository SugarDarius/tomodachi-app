'use client'

import { ContactIcon, ArrowLeft, ArrowRight } from 'lucide-react'

import { type Contact } from '~/schema'
import { formatNumberWithCommas } from '~/utils/format-number'
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

import { useTableRowsStore } from '../_stores/table-rows'

import { usePaginatedContactsList } from '../_hooks/use-paginated-contacts-list'
import { useDynamicColumns } from '../_hooks/use-dynamic-columns'

import { TableActions } from './table-actions'

export function ContactsTable({
  listId,
  initialPage,
}: {
  listId: string
  initialPage: ContactsListMembersPage
}) {
  const { isRowSelected, unSelectAll } = useTableRowsStore()

  const {
    page,
    handlePrevious,
    handleNext,
    handleRefresh,
    canGoPrevious,
    canGoNext,
  } = usePaginatedContactsList({
    listId,
    initialPage,
    onPageChange: () => unSelectAll(),
  })
  const columns = useDynamicColumns({ columnMap: page.columnMap })

  if (page.totalCount === 0) {
    return (
      <div className='flex flex-col gap-2 flex-1 items-center justify-center'>
        <div className='flex flex-col gap-2 items-center justify-center'>
          <ContactIcon className='size-10' />
          <ImportContactsButton listId={listId} shortcut={false} />
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-2 flex-1 overflow-hidden'>
      <TableActions
        listId={listId}
        pageIndex={page.pageIndex}
        totalPages={page.totalPages}
        onRefresh={handleRefresh}
      />
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
              {({ row }) => {
                const selected = isRowSelected((row.original as Contact).id)
                return (
                  <TableRow
                    key={row.id}
                    row={row}
                    className='cursor-pointer'
                    selected={selected}
                  >
                    {({ cell }) => <TableCell cell={cell} key={cell.id} />}
                  </TableRow>
                )
              }}
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
        <div className='flex items-center gap-1'>
          <Button
            onClick={handlePrevious}
            size='sm'
            variant='secondary'
            disabled={!canGoPrevious}
          >
            <ArrowLeft className='size-4' />
            <span className='text-sm'>Previous</span>
          </Button>

          <Button
            onClick={handleNext}
            size='sm'
            variant='secondary'
            disabled={!canGoNext}
          >
            <span className='text-sm'>Next</span>
            <ArrowRight className='size-4' />
          </Button>
        </div>
      </div>
    </div>
  )
}
