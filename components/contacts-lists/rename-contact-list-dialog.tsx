'use client'

import { useActionState, useState } from 'react'

import { type ContactsList } from '~/schema'
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
import { Field, FieldGroup } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

import { renameContactList, type RenameContactListResult } from './actions'

export function RenameContactListDialog({
  list,
  children,
}: {
  list: ContactsList
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [, formAction, isPending] = useActionState<
    RenameContactListResult | null,
    FormData
  >(async (_prevState, formData) => {
    const result = await renameContactList(formData)
    if (result?.success) {
      setOpen(false)
    }
    return result
  }, null)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='sm:max-w-sm'>
        <form action={formAction} className='space-y-4'>
          <input type='hidden' name='id' value={list.id} />
          <DialogHeader>
            <DialogTitle>Rename contact list</DialogTitle>
            <DialogDescription>
              Choose a new name for this contact list.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label htmlFor='name'>Name</Label>
              <Input
                id='name'
                name='name'
                placeholder='prospects'
                defaultValue={list.name}
                required
                autoFocus
              />
            </Field>
          </FieldGroup>
          <DialogFooter className='border-0'>
            <DialogClose asChild>
              <Button type='button' variant='outline'>
                Cancel
              </Button>
            </DialogClose>
            <Button type='submit' disabled={isPending}>
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
