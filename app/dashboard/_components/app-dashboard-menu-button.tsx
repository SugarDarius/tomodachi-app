'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutGrid } from 'lucide-react'

import { Skeleton } from '~/components/ui/skeleton'
import { SidebarMenuButton } from '~/components/ui/sidebar'

export const AppDashboardMenuButtonSkeleton = () => (
  <Skeleton className='w-full h-8 rounded-md' />
)

export function AppDashboardMenuButton() {
  const pathname = usePathname()

  return (
    <SidebarMenuButton
      asChild
      isActive={pathname === '/dashboard'}
      className='data-active:bg-accent-foreground/10 transition-all duration-150 ease-in-out hover:bg-accent-foreground/10'
    >
      <Link href='/dashboard'>
        <LayoutGrid className='size-4' />
        dashboard
      </Link>
    </SidebarMenuButton>
  )
}
