/* Canonical contact columns stored as first-class DB citizens) */
export type CanonicalContactField = 'email' | 'first_name' | 'last_name'

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
export type ColumnMapping = {
  canonical: { [F in CanonicalContactField]: string }
  varying: string[]
}

export type CanonicalColumns = {
  [F in CanonicalContactField]?: string
}
