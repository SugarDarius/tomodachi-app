import Link from 'next/link'
import { Suspense } from 'react'
import { HomeIcon } from 'lucide-react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '~/components/ui/breadcrumb'

import {
  BreadcrumbItemName,
  BreadcrumbItemNameSkeleton,
} from './_components/breadcrumb-item-name'

import { HeadingSkeleton, Heading } from './_components/heading'
import {
  ContactsTable,
  ContactsTableSkeleton,
} from './_components/contacts-table'
import { ImportContactsButtonSuspense } from '~/components/contacts/import-contact-button-suspense'

import {
  ContactsListAction,
  ContactsListActionSkeleton,
} from './_components/contacts-list-action'

export default async function Page({
  params,
}: {
  params: Promise<{ listId: string }>
}) {
  return (
    <div className='flex flex-col gap-4 p-4 min-h-full'>
      <div className='flex items-center justify-between flex-none'>
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
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Suspense fallback={<BreadcrumbItemNameSkeleton />}>
                <BreadcrumbItemName params={params} />
              </Suspense>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className='flex flex-row items-center gap-2'>
          <Suspense>
            <ImportContactsButtonSuspense params={params} />
          </Suspense>
          <Suspense fallback={<ContactsListActionSkeleton />}>
            <ContactsListAction params={params} />
          </Suspense>
        </div>
      </div>
      <div className='flex flex-col gap-4 flex-none'>
        <Suspense fallback={<HeadingSkeleton />}>
          <Heading params={params} />
        </Suspense>
      </div>
      <div className='flex flex-col gap-2 flex-1'>
        <Suspense fallback={<ContactsTableSkeleton />}>
          <ContactsTable params={params} />
        </Suspense>
      </div>
    </div>
  )
}
