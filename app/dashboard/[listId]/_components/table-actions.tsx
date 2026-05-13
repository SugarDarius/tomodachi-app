'use client'

import { Plus } from 'lucide-react'

import { Button } from '~/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip'

export function TableActions() {
  return (
    <div className='flex items-center justify-between py-2 flex-none border-b border-border'>
      <Button variant='outline'>
        <Tooltip>
          <TooltipTrigger>
            <span className='inline-flex gap-1.5 cursor-not-allowed text-muted-foreground hover:text-muted-foreground hover:bg-transparent'>
              <Plus className='size-4' />
              Create contact
            </span>
          </TooltipTrigger>
          <TooltipContent>Coming soon</TooltipContent>
        </Tooltip>
      </Button>
    </div>
  )
}
