import Link from 'next/link'

import { capitalize } from '~/utils/chars'

import { BreadcrumbLink } from '~/components/ui/breadcrumb'
import { Skeleton } from '~/components/ui/skeleton'

import { getContactsList } from '../_lib/contacts-list'

export const BreadcrumbItemNameSkeleton = () => (
  <Skeleton className='w-20 h-4' />
)

export async function BreadcrumbItemName({
  params,
}: {
  params: Promise<{ listId: string }>
}) {
  const { listId } = await params
  const list = await getContactsList({ id: listId })

  if (list === null) {
    return null
  }

  return (
    <BreadcrumbLink asChild>
      <Link href={`/dashboard/${list.id}`}>{capitalize(list.name)}</Link>
    </BreadcrumbLink>
  )
}
