import { Skeleton } from '~/components/ui/skeleton'
import { ImportContactsButton } from './import-contacts-button'

export const ImportContactsButtonSkeleton = () => (
  <Skeleton className='w-[148px] h-8' />
)

export async function ImportContactsButtonSuspense({
  params,
}: {
  params: Promise<{ listId: string }>
}) {
  const { listId } = await params
  return <ImportContactsButton listId={listId} />
}
