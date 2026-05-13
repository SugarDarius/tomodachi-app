'use client'

import { usePathname } from 'next/navigation'
import { useTransition, useCallback, useState } from 'react'

import { type ContactsList } from '~/schema'
import { capitalize } from '~/utils/chars'

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

import { deleteContactList } from './actions'

export function DeleteContactListDialog({
  list,
  children,
}: {
  list: ContactsList
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()

  const handleDelete = useCallback(() => {
    startTransition(async () => {
      const result = await deleteContactList({
        id: list.id,
        redirectToDashboard: pathname === `/dashboard/${list.id}`,
      })

      if (!result.success) {
        console.error(result.error)
        // TODO: add toast here
      } else {
        startTransition(() => {
          setOpen(false)
        })
      }
    })
  }, [list.id, pathname])

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className='sm:max-w-sm'>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete contact list</AlertDialogTitle>
          <AlertDialogDescription className='flex flex-col gap-0.5'>
            <span>
              Are you sure you want to delete{' '}
              <span className='font-medium text-foreground'>
                {capitalize(list.name)}
              </span>
              ?{' '}
            </span>
            <span className='font-semibold text-foreground'>
              This action cannot be undone.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className='border-0'>
          <AlertDialogCancel disabled={pending}>
            Cancel
            <KbdGroup>
              <Kbd className='rounded-sm border border-border'>Esc</Kbd>
            </KbdGroup>
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            variant='destructive'
            onClick={handleDelete}
          >
            Delete
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
