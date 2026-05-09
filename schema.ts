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
  pgEnum,
  integer,
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
 * Enum for the ingestion status of a contact import.
 */
export const contactImportStatusEnum = pgEnum('contact_import_status', [
  'running',
  'completed',
  'failed',
])

/**
 * `contact_imports` table
 * Represents one CSV file uploaded to a blob storage (Vercel Blob)
 * and ingested in `contacts` and `contacts_list_members` tables.
 */
export const contactImports = pgTable(
  'contact_imports',
  {
    /**
     * The unique identifier for the contact import.
     */
    id: uuid('id').primaryKey().defaultRandom(),
    /**
     * Tenant ID representing which entity owns this contact import.
     */
    tenantId: text('tenant_id').notNull(),
    /**
     * The list ID that the contact import is associated with.
     */
    listId: uuid('list_id')
      .notNull()
      .references(() => contactsLists.id, { onDelete: 'cascade' }),
    /**
     * Blob storage URL for the CSV file.
     */
    blobUrl: text('blob_url').notNull(),
    /**
     * Original filename of the CSV file.
     */
    originalFilename: text('original_filename').notNull(),
    /**
     * Content type of the CSV file.
     */
    contentType: text('content_type').notNull(),
    /**
     * Mapping of CSV headers to the canonical and varying fields in the contacts table.
     * @example
     * {
     *  "canonical": {
     *    "email": "email",
     *    "first_name": "firstName",
     *    "last_name": "lastName",
     *  },
     *  "varying": ["company", "phone"]
     * }
     */
    columnMap: jsonb('column_map').notNull().default({}),
    /**
     * Ingestion status of the contact import.
     */
    ingestionStatus: contactImportStatusEnum('ingestion_status')
      .notNull()
      .default('running'),
    /**
     * Number of csv rows inspected
     */
    numberOfInspectedRows: integer('number_of_inspected_rows')
      .notNull()
      .default(0),
    /**
     * Number of csv rows successfully ingested
     */
    numberOfIngestedRows: integer('number_of_ingested_rows')
      .notNull()
      .default(0),
    /**
     * Number of skipped rows (when a error is detected)
     */
    numberOfSkippedRows: integer('number_of_skipped_rows').notNull().default(0),
    /**
     * Errors detected during ingestion
     * @example
     * [
     *  {
     *    "rowNumber": 1,
     *    "error": "Invalid email address",
     *  }
     * ]
     */
    errors: jsonb('errors').notNull().default({}),
    /**
     * When the contact import was created.
     */
    createdAt: timestamp('created_at').notNull().defaultNow(),
    /**
     * When the contact import was updated.
     */
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    /**
     * When the contact import was completed.
     */
    completedAt: timestamp('completed_at'),
  },
  (t) => [
    index('contact_imports_tenant_list_created_idx').on(
      t.tenantId,
      t.listId,
      t.createdAt.desc()
    ),
  ]
)

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
