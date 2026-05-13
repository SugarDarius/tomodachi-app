import Link from 'next/link'
import { Undo } from 'lucide-react'

import { Button } from '~/components/ui/button'
import { Skeleton } from '~/components/ui/skeleton'

export const QuitButtonSkeleton = () => (
  <Skeleton className='size-8 rounded-lg' />
)

export async function QuitButton({
  params,
}: {
  params: Promise<{ listId: string }>
}) {
  const { listId } = await params

  return (
    <Button variant='secondary' asChild size='icon'>
      <Link href={`/dashboard/${listId}`}>
        <Undo className='size-4' />
      </Link>
    </Button>
  )
}
