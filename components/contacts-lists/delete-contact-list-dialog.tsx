'use client'

import { useActionState } from 'react'

import { type ContactsList } from '~/schema'
import { capitalize } from '~/utils/chars'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
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
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='sm:max-w-sm'>
        <form action={formAction} className='space-y-4'>
          <input type='hidden' name='id' value={list.id} />
          <DialogHeader>
            <DialogTitle>Delete contact list</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-medium text-foreground'>
                {capitalize(list.name)}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='border-0'>
            <DialogClose asChild>
              <Button type='button' variant='outline'>
                Cancel
                <KbdGroup>
                  <Kbd className='rounded-sm border border-border'>Esc</Kbd>
                </KbdGroup>
              </Button>
            </DialogClose>
            <Button type='submit' variant='destructive' disabled={isPending}>
              Delete
              <KbdGroup>
                <Kbd className='rounded-sm border border-border'>⏎</Kbd>
              </KbdGroup>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
