import { Skeleton } from '~/components/ui/skeleton'
import { ImportContactsButton } from './import-contacts-button'

export const ImportContactsButtonSkeleton = () => (
  <Skeleton className='w-[148px] h-8' />
)

export async function ImportContactsButtonSuspense({
  params,
  appearance = 'default',
  shortcut = true,
}: {
  params: Promise<{ listId: string }>
  appearance?: 'default' | 'icon'
  shortcut?: boolean
}) {
  const { listId } = await params
  return (
    <ImportContactsButton
      listId={listId}
      appearance={appearance}
      shortcut={shortcut}
    />
  )
}
