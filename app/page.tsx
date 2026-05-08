import { redirect } from 'next/navigation'
import { auth } from '~/lib/auth/server'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const { data: session } = await auth.getSession()
  if (!session) {
    redirect('/auth/sign-in')
  }

  redirect('/dashboard')
}
