'use client'

import { Plus } from 'lucide-react'

import { Button } from '~/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip'

import { useTableRowsStore } from '../_stores/table-rows'

export function TableActions({ listId }: { listId: string }) {
  const { allSelected } = useTableRowsStore()

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
      <div className='flex items-center gap-2'></div>
    </div>
  )
}
