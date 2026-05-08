import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar'
import { ImportContactsProvider } from '~/components/contacts/import-contacts-provider'

import { getContactsLists } from './_lib/contacts-lists'
import { AppSidebar } from './_components/app-sidebar'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex flex-row h-screen w-screen'>
      <SidebarProvider>
        <ImportContactsProvider>
          <AppSidebar getContactsListsPromise={getContactsLists()} />
          <SidebarInset className='overflow-y-auto'>{children}</SidebarInset>
        </ImportContactsProvider>
      </SidebarProvider>
    </div>
  )
}
