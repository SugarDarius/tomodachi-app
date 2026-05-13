'use client'

import { Plus, RefreshCw } from 'lucide-react'

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
  onRefresh,
}: {
  listId: string
  onRefresh: () => void
}) {
  const { getSelectedRowIds } = useTableRowsStore()

  const selectedRowIds = getSelectedRowIds()

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
        {selectedRowIds.length > 0 ? (
          <DeleteContactsDialog
            listId={listId}
            selectedRowIds={selectedRowIds}
            refresh={onRefresh}
          />
        ) : null}
        <Button variant='outline' onClick={onRefresh}>
          <RefreshCw className='size-4' />
        </Button>
      </div>
    </div>
  )
}
