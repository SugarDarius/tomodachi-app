'use server'

import { inArray } from 'drizzle-orm'

import { array, object, string } from 'decoders'
import {
  createSafeServerAction,
  type SafeServerActionError,
  type SafeServerActionResult,
} from '@sugardarius/anzen'

import { contacts } from '~/schema'
import { db } from '~/lib/db'
import { auth } from '~/lib/auth/server'

export const deleteContacts = createSafeServerAction(
  {
    id: 'contacts/delete',
    input: object({
      listId: string,
      rowIds: array(string),
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
  async ({ input, tagErr }) => {
    const { rowIds } = input

    const results = await db
      .delete(contacts)
      .where(inArray(contacts.id, rowIds))
      .returning({ deleted: contacts.id })

    if (results.length !== rowIds.length) {
      tagErr('CONTACT_DELETION_FAILED', {
        message: 'failed to delete contacts',
      })
    }

    return {
      deleted: true,
    }
  }
)

// TODO: add in `@sugardarius/anzen` an infer helper type
export type DeleteContactsResult = SafeServerActionResult<
  { deleted: boolean },
  SafeServerActionError
>
