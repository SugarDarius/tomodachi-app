import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar'
import { AppSidebar } from './_components/app-sidebar'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex flex-row h-screen w-screen'>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className='overflow-y-auto'>{children}</SidebarInset>
      </SidebarProvider>
    </div>
  )
}
