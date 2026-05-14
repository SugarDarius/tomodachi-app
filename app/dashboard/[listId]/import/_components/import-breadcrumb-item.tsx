import Link from 'next/link'

import { Skeleton } from '~/components/ui/skeleton'
import { BreadcrumbItem, BreadcrumbLink } from '~/components/ui/breadcrumb'

export const ImportBreadcrumbItemSkeleton = () => (
  <Skeleton className='w-11 h-5' />
)

export async function ImportBreadcrumbItem({
  params,
}: {
  params: Promise<{ listId: string }>
}) {
  const { listId } = await params

  return (
    <BreadcrumbItem>
      <BreadcrumbLink asChild>
        <Link href={`/dashboard/${listId}/import`}>Import contacts</Link>
      </BreadcrumbLink>
    </BreadcrumbItem>
  )
}
