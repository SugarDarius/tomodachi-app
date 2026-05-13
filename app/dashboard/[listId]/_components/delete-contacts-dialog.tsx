'use client'

import { useTransition, useState, useCallback } from 'react'
import { Trash } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'
import { Kbd, KbdGroup } from '~/components/ui/kbd'

import { deleteContacts } from '../_lib/actions'

export function DeleteContactsDialog({
  listId,
  selectedRowIds,
  refresh,
}: {
  listId: string
  selectedRowIds: string[]
  refresh: () => void
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const handleDelete = useCallback(() => {
    startTransition(async () => {
      const result = await deleteContacts({
        listId,
        rowIds: selectedRowIds,
      })

      if (!result.success) {
        console.error(result.error)
        // TODO: add toast here
      } else {
        setOpen(false)
        refresh()
      }
    })
  }, [listId, refresh, selectedRowIds])

  const numberOfSelectedRows = selectedRowIds.length

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant='default'>
          <Trash className='size-4' />
          Delete {numberOfSelectedRows}{' '}
          {numberOfSelectedRows === 1 ? 'contact' : 'contacts'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Confirm contact{numberOfSelectedRows === 1 ? '' : 's'} deletion
          </AlertDialogTitle>
          <AlertDialogDescription>
            You are about to permanently delete the selected contact
            {numberOfSelectedRows === 1 ? '' : 's'} from the dataset.{' '}
            <span className='font-semibold text-foreground'>
              This action cannot be undone.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            Cancel
            <KbdGroup>
              <Kbd className='rounded-sm border border-border'>Esc</Kbd>
            </KbdGroup>
          </AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            onClick={handleDelete}
            disabled={pending}
          >
            Delete contact{numberOfSelectedRows === 1 ? '' : 's'}
            <KbdGroup>
              <Kbd className='rounded-sm border bg-destructive/10 text-destructive border-destructive/20'>
                ⏎
              </Kbd>
            </KbdGroup>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
