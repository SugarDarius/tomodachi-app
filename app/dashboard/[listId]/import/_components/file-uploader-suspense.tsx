import { Skeleton } from '~/components/ui/skeleton'
import { FileUploader } from './file-uploader'

export const FileUploaderSkeleton = () => <Skeleton className='w-full h-full' />

export async function FileUploaderSuspense({
  params,
}: {
  params: Promise<{ listId: string }>
}) {
  const { listId } = await params

  return <FileUploader listId={listId} />
}
