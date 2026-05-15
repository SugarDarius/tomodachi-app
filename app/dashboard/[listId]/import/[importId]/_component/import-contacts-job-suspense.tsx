import { redirect } from 'next/navigation'

import { Skeleton } from '~/components/ui/skeleton'

import { getContactImportJob } from '../_lib/jobs'
import { ImportContactsJob } from './import-contacts-job'

export const ImportContactsJobSkeleton = () => (
  <Skeleton className='w-full h-full' />
)

export async function ImportContactsJobSuspense({
  params,
}: {
  params: Promise<{ listId: string; importId: string }>
}) {
  const { listId, importId } = await params
  const contactImportJob = await getContactImportJob({ importId, listId })

  if (contactImportJob === null) {
    redirect(`/dashboard/${listId}`)
  }

  return (
    <ImportContactsJob
      importId={importId}
      listId={listId}
      initialContactImportJob={contactImportJob}
    />
  )
}
