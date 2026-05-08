import { sql } from 'drizzle-orm'
import {
  pgTable,
  text,
  uuid,
  check,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core'

/**
 * `contacts_lists` table
 *
 * Tenant-scoped named list (audience, campaign folder, etc.) that **membership** rows in
 * `contacts_list_members` attach to canonical `contacts`.
 */
export const contactsLists = pgTable(
  'contacts_lists',
  {
    /**
     * The unique identifier for the contact list.
     */
    id: uuid('id').primaryKey().defaultRandom(),
    /**
     * Tenant that owns this list
     */
    tenantId: text('tenant_id').notNull(),
    /**
     * Human-visible name for the list.
     */
    name: text('name').notNull(),
    /**
     * When the list was created.
     */
    createdAt: timestamp('created_at').notNull().defaultNow(),
    /**
     * When the list was last updated.
     */
    updatedAt: timestamp('updated_at').notNull().defaultNow(),

    /**
     * When the list was soft deleted.
     */
    deletedAt: timestamp('deleted_at'),
  },
  (t) => [
    index('contacts_lists_tenant_created_idx').on(
      t.tenantId,
      t.createdAt.desc()
    ),
  ]
)

export type ContactsList = typeof contactsLists.$inferSelect
export type CreateContactsList = typeof contactsLists.$inferInsert

/**
 * `contacts` table
 *
 * Represents the canonical contact rows merged from staging (or created elsewhere like crud operations).
 */
export const contacts = pgTable(
  'contacts',
  {
    /**
     * The unique identifier for the contact.
     */
    id: uuid('id').primaryKey().defaultRandom(),
    /**
     * Tenant ID representing which entity owns this contact.
     * Every row in this table belongs to one exactly one tenant.
     */
    tenantId: text('tenant_id').notNull(),
    /**
     * The email address of the contact.
     * Must be non-empty after trim.
     */
    email: text('email').notNull(),
    /**
     * The first name of the contact.
     */
    firstName: text('first_name').notNull().default(''),
    /**
     * The last name of the contact.
     */
    lastName: text('last_name').notNull().default(''),
    /**
     * The normalized email address of the contact.
     * Generated for indexing and dedupe. Never set manually in inserts.
     */
    emailNormalized: text('email_normalized').generatedAlwaysAs(
      sql`lower(trim(email))`
    ),
    /**
     * Optional JSON for varying fields not modeled as columns (phones, tags, etc.).
     */
    varyingFields: jsonb('varying_fields').notNull().default({}),
    /**
     * The timestamp when the contact was updated.
     */
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    /**
     * The timestamp when the contact was created.
     */
    createdAt: timestamp('created_at').notNull().defaultNow(),
    /**
     * The timestamp when the contact was deleted.
     */
    deletedAt: timestamp('deleted_at'),
  },
  (t) => [
    check('email_present', sql`length(trim(email)) > 0`),
    uniqueIndex('contacts_tenant_email_normalized_uidx').on(
      t.tenantId,
      t.emailNormalized
    ),
    index('contacts_tenant_created_idx').on(t.tenantId, t.createdAt.desc()),
  ]
)

export type Contact = typeof contacts.$inferSelect
export type CreateContact = typeof contacts.$inferInsert

/**
 * `contacts_list_members` join table
 *
 * Links a `contacts_lists` row to `contacts` (many-to-many).
 * Enforce same-tenant in application code.
 */
export const contactsListMembers = pgTable(
  'contacts_list_members',
  {
    listId: uuid('list_id')
      .notNull()
      .references(() => contactsLists.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    /**
     * When this contact was added to the list.
     */
    addedAt: timestamp('added_at').notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.listId, t.contactId] }),
    index('contacts_list_members_contact_idx').on(t.contactId),
  ]
)
