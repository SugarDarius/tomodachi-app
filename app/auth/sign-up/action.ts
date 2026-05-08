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
 * Safe server action to sign up with an email and password.
 * The name is basically a copy of the email local part.
 */
export const signUpWithEmail = createSafeServerAction(
  {
    id: 'auth/sign-up-with-email',
    input: object({
      email,
      password: string,
    }),
  },
  async ({ input, tagErr }) => {
    const { error } = await auth.signUp.email({
      email: input.email,
      password: input.password,
      name: input.email.split('@')[0],
    })

    if (error) {
      tagErr('ACCOUNT_CREATION_FAILED', {
        message: error.message ?? 'failed to create account',
      })
    }

    redirect('/dashboard')
  }
)

// TODO: 👉🏻 Add in Anzen an infer helper type
export type SignUpWithEmailResult = SafeServerActionResult<
  undefined,
  SafeServerActionError
>
