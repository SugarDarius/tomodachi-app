'use client'

import { Plus, RefreshCw, Trash, Search, XIcon } from 'lucide-react'

import { Button } from '~/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '~/components/ui/input-group'

import { useTableRowsStore } from '../_stores/table-rows'
import { DeleteContactsDialog } from './delete-contacts-dialog'

export function TableActions({
  listId,
  pageIndex,
  totalPages,
  searchQuery,
  refresh,
  updateSearchQuery,
}: {
  listId: string
  pageIndex: number
  totalPages: number
  searchQuery: string
  refresh: () => void
  updateSearchQuery: (query: string) => void
}) {
  const { getSelectedRowIds } = useTableRowsStore()

  const selectedRowIds = getSelectedRowIds()
  const numberOfSelectedRows = selectedRowIds.length

  const handleResetSearch = () => {
    updateSearchQuery('')
  }

  const handleUpdateSearchQuery = (query: string) => {
    updateSearchQuery(query)
  }

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
        <InputGroup>
          <InputGroupInput
            placeholder='Search contacts by email…'
            className='w-56'
            value={searchQuery}
            onChange={(e) => handleUpdateSearchQuery(e.target.value)}
          />
          <InputGroupAddon>
            <Search className='size-3 text-muted-foreground' />
          </InputGroupAddon>
          <InputGroupAddon align='inline-end'>
            <InputGroupButton
              variant='secondary'
              size='icon-xs'
              onClick={handleResetSearch}
            >
              <XIcon className='size-3 text-muted-foreground' />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
      <div className='flex items-center gap-2'>
        {numberOfSelectedRows ? (
          <DeleteContactsDialog
            listId={listId}
            contactIds={selectedRowIds}
            refresh={refresh}
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
            <Button variant='outline' onClick={refresh}>
              <RefreshCw className='size-4' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refresh contacts</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
