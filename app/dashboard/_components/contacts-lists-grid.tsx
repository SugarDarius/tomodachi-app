'use client'

import { use } from 'react'

import { type ContactsList } from '~/schema'
import { formatDateAsEnUs } from '~/utils/format-date'
import { capitalize } from '~/utils/chars'

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import { CalendarIcon, Contact2 } from 'lucide-react'
import Link from 'next/link'

export function ContactsListCardSkeleton() {
  return (
    <Card className='gap-8'>
      <CardHeader>
        <div className='flex items-center gap-2'>
          <Skeleton className='size-8 shrink-0 rounded-lg' />
          <Skeleton className='h-5 w-32' />
        </div>
      </CardHeader>
      <CardContent className='pt-0 gap-2'>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-4 w-4' />
          <Skeleton className='h-4 w-24' />
        </div>
        <Skeleton className='h-3 w-16' />
      </CardContent>
    </Card>
  )
}

export function ContactsListsGridSkeleton({ count }: { count: number }) {
  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
      {Array.from({ length: count }).map((_, i) => (
        <ContactsListCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ContactsListsGrid({
  getContactsListsPromise,
}: {
  getContactsListsPromise: Promise<ContactsList[]>
}) {
  const lists = use(getContactsListsPromise)

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
      {lists.map((list) => (
        <Link href={`/dashboard/${list.id}`} key={list.id}>
          <Card className='transition-all hover:shadow-md hover:border-primary/20 gap-8'>
            <CardHeader>
              <div className='flex items-center gap-2'>
                <div className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10'>
                  <Contact2 className='size-4' />
                </div>
                <CardTitle className='text-base font-semibold leading-tight'>
                  {capitalize(list.name)}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className='pt-0 gap-1'>
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <CalendarIcon className='h-4 w-4' />
                <span>{formatDateAsEnUs(list.createdAt)}</span>
              </div>
              <div className='mt-2 text-xs text-muted-foreground/70'>
                ID: {list.id}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
