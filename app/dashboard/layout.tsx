import { ImportContactsProvider } from '~/components/contacts/import-contacts-provider'

import { RealtimeProvider } from './_providers/realtime-provider'
import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar'

import { AppSidebar } from './_components/app-sidebar'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RealtimeProvider>
      <ImportContactsProvider>
        <div className='flex flex-row h-screen w-screen'>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className='overflow-y-auto'>{children}</SidebarInset>
          </SidebarProvider>
        </div>
      </ImportContactsProvider>
    </RealtimeProvider>
  )
}
