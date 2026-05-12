import { ContactIcon } from 'lucide-react'

import { Skeleton } from '~/components/ui/skeleton'
import { ImportContactsButton } from '~/components/contacts/import-contacts-button'

import { getContactsListMembers } from '../_lib/contacts-list'
import { ContactsTableContent } from './contacts-table-content'

export const ContactsTableSkeleton = () => <Skeleton className='w-full h-18' />

export async function ContactsTable({ listId }: { listId: string }) {
  const initialPage = await getContactsListMembers({ id: listId })
  // TODO: add client side hydration after initial page is loaded

  // TODO: add hook to handle pagination, sorting and filtering

  // TODO: add paginator component

  if (initialPage.totalCount === 0) {
    return (
      <div className='flex flex-col gap-2 flex-1 items-center justify-center'>
        <div className='flex flex-col gap-2 items-center justify-center'>
          <ContactIcon className='size-10' />
          <ImportContactsButton listId={listId} />
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-2 flex-1'>
      <ContactsTableContent initialContacts={initialPage.contacts} />
    </div>
  )
}
