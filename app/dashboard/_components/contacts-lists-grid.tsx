import Link from 'next/link'
import { CalendarIcon, Contact2 } from 'lucide-react'

import { capitalize } from '~/utils/chars'
import { formatDateAsEnUs } from '~/utils/format-date'
import { formatNumberWithCommas } from '~/utils/format-number'

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import { Pill, PillIndicator } from '~/components/kibo-ui/pill'

import { getContactsLists } from '../_lib/contacts-lists'

export function ContactsListCardSkeleton() {
  return (
    <Card className='gap-8'>
      <CardHeader className='flex-none'>
        <div className='flex items-start justify-between'>
          <div className='flex items-center gap-2'>
            <Skeleton className='size-10 shrink-0 rounded-lg' />
            <div className='flex flex-col gap-0.5'>
              <Skeleton className='h-5 w-24' />
              <Skeleton className='h-4 w-32' />
            </div>
          </div>
          <Skeleton className='h-5 w-16 rounded-full' />
        </div>
      </CardHeader>
      <CardContent className='pt-0 flex-1 flex flex-col justify-end'>
        <div className='flex items-center gap-2 justify-between'>
          <div className='flex items-center gap-2'>
            <Skeleton className='size-5 rounded-xs' />
            <Skeleton className='h-5 w-21 rounded-xs' />
          </div>
          <div className='flex items-center gap-2'>
            <Skeleton className='size-5 rounded-xs' />
            <Skeleton className='h-5 w-21 rounded-xs' />
          </div>
        </div>
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

export async function ContactsListsGrid() {
  const lists = await getContactsLists()

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
      {lists.map((list) => (
        <Link href={`/dashboard/${list.id}`} key={list.id}>
          <Card className='transition-all hover:shadow-md hover:border-primary/20 gap-8 min-h-40'>
            <CardHeader className='flex-none'>
              <div className='flex items-start justify-between'>
                <div className='flex items-center gap-2'>
                  <div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10'>
                    <Contact2 className='size-5' />
                  </div>
                  <div className='flex flex-col gap-0.5'>
                    <CardTitle className='text-base font-semibold leading-tight'>
                      {capitalize(list.name)}
                    </CardTitle>
                    <span className='text-xs text-muted-foreground'>
                      Manage all contacts
                    </span>
                  </div>
                </div>
                <Pill>
                  <PillIndicator
                    variant={list.meta.contactCount > 0 ? 'success' : 'error'}
                    pulse={list.meta.contactCount > 0}
                  />
                  {list.meta.contactCount > 0 ? 'Active' : 'Inactive'}
                </Pill>
              </div>
            </CardHeader>
            <CardContent className='pt-0 flex-1 flex flex-col justify-end'>
              <div className='flex items-center gap-2 justify-between'>
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <CalendarIcon className='h-4 w-4' />
                  <span>{formatDateAsEnUs(list.createdAt)}</span>
                </div>
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <Contact2 className='h-4 w-4' />
                  <span>
                    {formatNumberWithCommas(list.meta.contactCount)}{' '}
                    {list.meta.contactCount === 1 ? 'contact' : 'contacts'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
