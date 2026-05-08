'use client'

import { useActionState } from 'react'
import { Plus } from 'lucide-react'

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

import { createContactList, type CreateContactListResult } from './action'

export function CreateContactListDialog({
  triggerVariant = 'outline',
}: {
  triggerVariant?: React.ComponentProps<typeof Button>['variant']
}) {
  const [, formAction, isPending] = useActionState<
    CreateContactListResult | null,
    FormData
  >(async (_prevState, formData) => createContactList(formData), null)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} className='justify-start'>
          <Plus className='size-4' />
          New contacts list
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
              </Button>
            </DialogClose>
            <Button type='submit' disabled={isPending}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
