'use client'

import { useActionState } from 'react'

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

import { deleteContactList, type DeleteContactListResult } from './actions'

export function DeleteContactListDialog({
  list,
  children,
}: {
  list: ContactsList
  children: React.ReactNode
}) {
  const [, formAction, isPending] = useActionState<
    DeleteContactListResult | null,
    FormData
  >(async (_prevState, formData) => deleteContactList(formData), null)

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className='sm:max-w-sm'>
        <form action={formAction} className='space-y-4'>
          <input type='hidden' name='id' value={list.id} />
          <AlertDialogHeader>
            <AlertDialogTitle>Delete contact list</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-medium text-foreground'>
                {capitalize(list.name)}
              </span>
              ?{' '}
              <span className='font-semibold text-foreground'>
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='border-0'>
            <AlertDialogCancel>
              Cancel
              <KbdGroup>
                <Kbd className='rounded-sm border border-border'>Esc</Kbd>
              </KbdGroup>
            </AlertDialogCancel>
            <AlertDialogAction
              type='submit'
              disabled={isPending}
              variant='destructive'
            >
              Delete
              <KbdGroup>
                <Kbd className='rounded-sm border bg-destructive/10 text-destructive border-destructive/20'>
                  ⏎
                </Kbd>
              </KbdGroup>
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
