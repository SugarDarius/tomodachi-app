'use client'

import { useActionState, useState } from 'react'
import { Plus } from 'lucide-react'
import { useHotkeys } from 'react-hotkeys-hook'

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
import { Kbd, KbdGroup } from '~/components/ui/kbd'

import { createContactList, type CreateContactListResult } from './actions'

export function CreateContactListDialog({
  triggerVariant = 'outline',
  shortcut = true,
}: {
  triggerVariant?: React.ComponentProps<typeof Button>['variant']
  shortcut?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [, formAction, isPending] = useActionState<
    CreateContactListResult | null,
    FormData
  >(async (_prevState, formData) => createContactList(formData), null)

  useHotkeys(
    'n',
    (e) => {
      e.preventDefault()
      if (!open) {
        setOpen(true)
      }
    },
    { enabled: shortcut }
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} className='justify-start'>
          <div className='flex items-center w-full justify-between gap-1.5'>
            <div className='flex items-center gap-1.5'>
              <Plus className='size-4' />
              New contacts list
            </div>
            <KbdGroup>
              <Kbd className='rounded-sm border border-border'>N</Kbd>
            </KbdGroup>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-sm'>
        <form action={formAction} className='space-y-4'>
          <DialogHeader>
            <DialogTitle>Create a new contact list</DialogTitle>
            <DialogDescription>
              Create a new list where you can import contacts from a CSV file.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label htmlFor='name'>Name</Label>
              <Input id='name' name='name' placeholder='prospects' required />
            </Field>
          </FieldGroup>
          <DialogFooter className='border-0'>
            <DialogClose asChild>
              <Button type='button' variant='outline'>
                Cancel
                <KbdGroup>
                  <Kbd className='rounded-sm border border-border'>Esc</Kbd>
                </KbdGroup>
              </Button>
            </DialogClose>
            <Button type='submit' disabled={isPending}>
              Create
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
