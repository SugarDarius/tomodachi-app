import { capitalize } from '~/utils/chars'
import { Skeleton } from '~/components/ui/skeleton'

import { getContactsList } from '../_lib/contacts-list'

export const HeadingSkeleton = () => (
  <div className='flex flex-col'>
    <Skeleton className='w-20 h-8' />
    <Skeleton className='w-40 h-6' />
  </div>
)

export async function Heading({
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
    <div className='flex flex-col'>
      <h1 className='text-2xl font-bold'>{capitalize(list.name)}</h1>
      <p className='text-muted-foreground'>
        Manage all your contacts in this list
      </p>
    </div>
  )
}
