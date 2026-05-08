'use client'

import { use } from 'react'

import { ContactsList } from '~/schema'
import { capitalize } from '~/utils/chars'
import { Skeleton } from '~/components/ui/skeleton'

export const HeadingSkeleton = () => (
  <div className='flex flex-col'>
    <Skeleton className='w-20 h-8' />
    <Skeleton className='w-40 h-6' />
  </div>
)

export function Heading({
  getContactsListPromise,
}: {
  getContactsListPromise: Promise<ContactsList | null>
}) {
  const list = use(getContactsListPromise)

  if (list === null) {
    return null
  }

  return (
    <div className='flex flex-col'>
      <h1 className='text-2xl font-bold'>{capitalize(list.name)}</h1>
      <p className='text-muted-foreground'>
        Manage all your contacts in this list
      </p>
    </div>
  )
}
