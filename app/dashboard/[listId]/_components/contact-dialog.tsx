'use client'

import { useState } from 'react'
import { Contact2, Copy, CopyCheck, Trash2 } from 'lucide-react'

import type { Contact } from '~/schema'

import { cn } from '~/lib/utils'
import { formatDateAsEnUs } from '~/utils/format-date'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '~/components/ui/sheet'
import { Button } from '~/components/ui/button'
import { ScrollArea } from '~/components/ui/scroll-area'

import { useCopyButton } from '~/hooks/use-copy-button'

import { DeleteContactsDialog } from './delete-contacts-dialog'

const ContactColumn = ({ name, value }: { name: string; value: string }) => {
  const [copied, onClick] = useCopyButton(async () => {
    await navigator.clipboard.writeText(value)
  })

  return (
    <div
      className={cn(
        'group flex items-center gap-4 p-3 rounded-xl border transition-all',
        'border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10'
      )}
    >
      <div className='flex items-center justify-between w-full gap-2'>
        <div className='flex flex-col gap-1'>
          <span className='text-xs text-muted-foreground  font-medium uppercase tracking-wide'>
            {name}
          </span>
          <span className='mt-1 text-sm truncate'>{value}</span>
        </div>
      </div>
      <Button
        variant='outline'
        size='icon-sm'
        onClick={onClick}
        className='bg-green-500/10 dark:bg-green-300/20 hover:bg-green-500/20 dark:hover:bg-green-300/30 border-green-500/40 dark:border-green-300/40'
      >
        {copied ? (
          <CopyCheck className='size-3 text-green-500 dark:text-green-300' />
        ) : (
          <Copy className='size-3 text-foreground/50' />
        )}
      </Button>
    </div>
  )
}

export function ContactDialog({
  listId,
  contact,
  refresh,
  children,
}: {
  listId: string
  contact: Contact
  refresh: () => void
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className='w-4xl! max-w-4xl!' showCloseButton={false}>
        <SheetHeader className='hidden'>
          <SheetTitle>
            {contact.firstName} {contact.lastName}
          </SheetTitle>
          <SheetDescription>{contact.emailNormalized}</SheetDescription>
        </SheetHeader>
        <div className='flex flex-col gap-2 p-4 flex-1 overflow-hidden'>
          <div className='flex flex-col gap-4 flex-1 overflow-hidden'>
            <div className='flex items-center justify-between p-4 rounded-lg border border-border/50 flex-non'>
              <div className='flex items-center gap-3'>
                <div className='flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10'>
                  <Contact2 className='w-5 h-5 text-primary' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='font-medium text-sm truncate'>
                    {contact.firstName} {contact.lastName}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {contact.emailNormalized}
                  </p>
                </div>
              </div>
              <DeleteContactsDialog
                listId={listId}
                contactIds={[contact.id]}
                refresh={refresh}
                onDeleted={() => setOpen(false)}
              >
                <Button variant='destructive' size='icon'>
                  <Trash2 className='size-4' />
                </Button>
              </DeleteContactsDialog>
            </div>

            <div className='flex-1 flex flex-col overflow-hidden gap-2'>
              <h3 className='text-xl font-semibold'>Columns</h3>
              <ScrollArea className='w-full h-full'>
                <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3'>
                  <ContactColumn
                    name='email'
                    value={contact.emailNormalized ?? ''}
                  />
                  <ContactColumn
                    name='first name'
                    value={contact.firstName ?? ''}
                  />
                  <ContactColumn
                    name='last name'
                    value={contact.lastName ?? ''}
                  />
                  {Object.entries(contact.varyingFields).map(([key, value]) => (
                    <ContactColumn key={key} name={key} value={value ?? ''} />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
        <SheetFooter className='border-t border-border/50 bg-muted/30'>
          <div className='flex items-center justify-between'>
            <span className='text-xs text-muted-foreground'>
              Created at {formatDateAsEnUs(contact.createdAt)}
            </span>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
