'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { object, string } from 'decoders'
import {
  createSafeServerAction,
  type SafeServerActionError,
  type SafeServerActionResult,
} from '@sugardarius/anzen'

import { contactsLists } from '~/schema'
import { db } from '~/lib/db'
import { auth } from '~/lib/auth/server'

/**
 * Safe server action to create a new contact list.
 */
export const createContactList = createSafeServerAction(
  {
    id: 'contacts-lists/create',
    input: object({
      name: string,
    }),
    authorize: async () => {
      const { data: session } = await auth.getSession()
      if (!session) {
        throw new Error('unauthorized')
      }

      return {
        tenantId: session.user.id,
      }
    },
  },
  async ({ auth, input, tagErr }) => {
    const result = await db
      .insert(contactsLists)
      .values({
        name: input.name,
        tenantId: auth.tenantId,
      })
      .returning({ insertedId: contactsLists.id })

    if (!result.length) {
      tagErr('CONTACT_LIST_CREATION_FAILED', {
        message: 'failed to create contact list',
      })
    }

    revalidatePath('/dashboard', 'layout')
    redirect(`/dashboard/${result[0].insertedId}`)
  }
)

export type CreateContactListResult = SafeServerActionResult<
  undefined,
  SafeServerActionError
>
