import { Suspense } from 'react'
import Link from 'next/link'
import { HomeIcon } from 'lucide-react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '~/components/ui/breadcrumb'
import { CreateContactListDialog } from '~/components/contacts-lists/create-contact-list-dialog'

import {
  ContactsListsGridSkeleton,
  ContactsListsGrid,
} from './_components/contacts-lists-grid'
import { getContactsLists } from './_lib/contacts-lists'

export default async function Page() {
  return (
    <div className='flex flex-col gap-4 p-4 min-h-full'>
      <div className='flex items-center justify-between'>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href='/dashboard'>
                  <HomeIcon className='size-4' />
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href='/dashboard'>Contacts lists</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <CreateContactListDialog triggerVariant='default' />
      </div>
      <div className='flex flex-col gap-4'>
        <div className='flex flex-col'>
          <h1 className='text-2xl font-bold'>Contacts lists</h1>
          <p className='text-muted-foreground'>
            Browse and manage your contacts lists
          </p>
        </div>
      </div>
      <Suspense fallback={<ContactsListsGridSkeleton count={4} />}>
        <ContactsListsGrid getContactsListsPromise={getContactsLists()} />
      </Suspense>
    </div>
  )
}
