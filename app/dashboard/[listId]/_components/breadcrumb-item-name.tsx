'use client'

import { use } from 'react'
import Link from 'next/link'

import { ContactsList } from '~/schema'
import { capitalize } from '~/utils/chars'

import { BreadcrumbLink } from '~/components/ui/breadcrumb'
import { Skeleton } from '~/components/ui/skeleton'

export const BreadcrumbItemNameSkeleton = () => (
  <Skeleton className='w-20 h-4' />
)

export function BreadcrumbItemName({
  getContactsListPromise,
}: {
  getContactsListPromise: Promise<ContactsList | null>
}) {
  const list = use(getContactsListPromise)

  if (list === null) {
    return null
  }

  return (
    <BreadcrumbLink asChild>
      <Link href={`/dashboard/${list.id}`}>{capitalize(list.name)}</Link>
    </BreadcrumbLink>
  )
}
