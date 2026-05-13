'use client'

import { Plus, RefreshCw, Trash } from 'lucide-react'

import { Button } from '~/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip'

import { useTableRowsStore } from '../_stores/table-rows'
import { DeleteContactsDialog } from './delete-contacts-dialog'

export function TableActions({
  listId,
  pageIndex,
  totalPages,
  onRefresh,
}: {
  listId: string
  pageIndex: number
  totalPages: number
  onRefresh: () => void
}) {
  const { getSelectedRowIds } = useTableRowsStore()

  const selectedRowIds = getSelectedRowIds()
  const numberOfSelectedRows = selectedRowIds.length

  return (
    <div className='flex items-center justify-between py-2 flex-none border-b border-border'>
      <div className='flex items-center gap-2'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              className='cursor-not-allowed text-muted-foreground hover:text-muted-foreground hover:bg-transparent'
            >
              <Plus className='size-4' />
              Create contact
            </Button>
          </TooltipTrigger>
          <TooltipContent>Coming soon</TooltipContent>
        </Tooltip>
      </div>
      <div className='flex items-center gap-2'>
        {numberOfSelectedRows ? (
          <DeleteContactsDialog
            listId={listId}
            contactIds={selectedRowIds}
            refresh={onRefresh}
          >
            <Button variant='default'>
              <Trash className='size-4' />
              Delete {numberOfSelectedRows}{' '}
              {numberOfSelectedRows === 1 ? 'contact' : 'contacts'}
            </Button>
          </DeleteContactsDialog>
        ) : null}
        <div className='flex items-center w-[60px] justify-center'>
          <span className='text-sm text-muted-foreground'>
            {pageIndex} / {totalPages}
          </span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='outline' onClick={onRefresh}>
              <RefreshCw className='size-4' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refresh contacts</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
