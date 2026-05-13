'use client'

import { useTransition, useState, useCallback } from 'react'

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
import { Kbd, KbdGroup } from '~/components/ui/kbd'

import { deleteContacts } from '../_lib/actions'

export function DeleteContactsDialog({
  listId,
  contactIds,
  refresh,
  children,
  onDeleted,
}: {
  listId: string
  contactIds: string[]
  refresh: () => void
  children: React.ReactNode
  onDeleted?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const handleDelete = useCallback(() => {
    startTransition(async () => {
      const result = await deleteContacts({
        listId,
        contactIds,
      })
      if (!result.success) {
        console.error(result.error)
        // TODO: add toast here
      } else {
        startTransition(() => {
          setOpen(false)
          refresh()
          onDeleted?.()
        })
      }
    })
  }, [listId, refresh, contactIds, onDeleted])

  const numberOfContacts = contactIds.length

  return (
    <AlertDialog open={open} onOpenChange={(open) => setOpen(open)}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Confirm contact{numberOfContacts === 1 ? '' : 's'} deletion
          </AlertDialogTitle>
          <AlertDialogDescription className='flex flex-col gap-0.5'>
            <span>
              You are about to permanently delete the selected contact
              {numberOfContacts === 1 ? '' : 's'} from the dataset.{' '}
            </span>
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
            Delete contact{numberOfContacts === 1 ? '' : 's'}
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
