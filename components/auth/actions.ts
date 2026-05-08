'use server'

import { redirect } from 'next/navigation'
import { auth } from '~/lib/auth/server'

/**
 * Minimal sign out server action to log out the user
 * and redirect to the sign page.
 */
export async function signOut() {
  await auth.signOut()
  redirect('/auth/sign-in')
}
