'use server'

import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { and, eq, isNull } from 'drizzle-orm'
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

    updateTag('contacts-lists')
    redirect(`/dashboard/${result[0].insertedId}`)
  }
)

export type CreateContactListResult = SafeServerActionResult<
  undefined,
  SafeServerActionError
>

/**
 * Safe server action to rename an existing contact list.
 */
export const renameContactList = createSafeServerAction(
  {
    id: 'contacts-lists/rename',
    input: object({
      id: string,
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
    const name = input.name.trim()
    if (name.length === 0) {
      tagErr('CONTACT_LIST_RENAME_INVALID_NAME', {
        message: 'name must not be empty',
      })
    }

    const result = await db
      .update(contactsLists)
      .set({ name, updatedAt: new Date() })
      .where(
        and(
          eq(contactsLists.id, input.id),
          eq(contactsLists.tenantId, auth.tenantId),
          isNull(contactsLists.deletedAt)
        )
      )
      .returning({ updatedId: contactsLists.id })

    if (!result.length) {
      tagErr('CONTACT_LIST_RENAME_FAILED', {
        message: 'failed to rename contact list',
      })
    }

    updateTag('contacts-lists')
  }
)

export type RenameContactListResult = SafeServerActionResult<
  void,
  SafeServerActionError
>

/**
 * Safe server action to soft-delete an existing contact list.
 */
export const deleteContactList = createSafeServerAction(
  {
    id: 'contacts-lists/delete',
    input: object({
      id: string,
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
    const now = new Date()
    const result = await db
      .update(contactsLists)
      .set({ deletedAt: now, updatedAt: now })
      .where(
        and(
          eq(contactsLists.id, input.id),
          eq(contactsLists.tenantId, auth.tenantId),
          isNull(contactsLists.deletedAt)
        )
      )
      .returning({ deletedId: contactsLists.id })

    if (!result.length) {
      tagErr('CONTACT_LIST_DELETION_FAILED', {
        message: 'failed to delete contact list',
      })
    }

    updateTag('contacts-lists')
    redirect('/dashboard')
  }
)

export type DeleteContactListResult = SafeServerActionResult<
  void,
  SafeServerActionError
>
