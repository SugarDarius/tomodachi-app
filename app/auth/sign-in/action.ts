'use server'

import { redirect } from 'next/navigation'
import { email, object, string } from 'decoders'
import {
  createSafeServerAction,
  type SafeServerActionError,
  type SafeServerActionResult,
} from '@sugardarius/anzen'

import { auth } from '~/lib/auth/server'

/**
 * Safe server action to sign in with an email and password.
 */
export const signInWithEmail = createSafeServerAction(
  {
    id: 'auth/sign-in-with-email',
    input: object({
      email,
      password: string,
    }),
  },
  async ({ input, tagErr }) => {
    const { error } = await auth.signIn.email({
      email: input.email,
      password: input.password,
    })

    if (error) {
      tagErr('SIGN_IN_FAILEd', {
        message: error.message ?? 'failed to sign in',
      })
    }

    redirect('/dashboard')
  }
)

// TODO: 👉🏻 Add in Anzen an infer helper type
export type SignInWithEmailResult = SafeServerActionResult<
  undefined,
  SafeServerActionError
>
