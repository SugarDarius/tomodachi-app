import { RealtimeProvider } from '@upstash/realtime/client'

import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar'
import { ImportContactsProvider } from '~/components/contacts/import-contacts-provider'

import { getContactsLists } from './_lib/contacts-lists'
import { AppSidebar } from './_components/app-sidebar'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RealtimeProvider>
      <ImportContactsProvider>
        <div className='flex flex-row h-screen w-screen'>
          <SidebarProvider>
            <AppSidebar getContactsListsPromise={getContactsLists()} />
            <SidebarInset className='overflow-y-auto'>{children}</SidebarInset>
          </SidebarProvider>
        </div>
      </ImportContactsProvider>
    </RealtimeProvider>
  )
}
