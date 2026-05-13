'use server'

import { and, eq, inArray } from 'drizzle-orm'

import { array, object, string } from 'decoders'
import {
  createSafeServerAction,
  type SafeServerActionError,
  type SafeServerActionResult,
} from '@sugardarius/anzen'

import { contacts, contactsListMembers } from '~/schema'
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
    const { listId, rowIds } = input

    const results = await db
      .delete(contacts)
      .where(
        and(
          inArray(contacts.id, rowIds),
          inArray(
            contacts.id,
            db
              .select({ id: contactsListMembers.contactId })
              .from(contactsListMembers)
              .where(eq(contactsListMembers.listId, listId))
          )
        )
      )
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
