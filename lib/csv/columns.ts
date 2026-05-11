import type { ColumnMapping, CanonicalColumns } from '~/schema'

/** Collapses header strings for lookups (matches knowledge/header index). */
export function normalizeHeader(label: string): string {
  return label
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/**
 * Collapses spelling variants (camelCase, snake_case, spaces, hyphens) so
 * `workEmail`, `work_email`, `Work Email`, etc. compare equal.
 */
export function headerMatchKey(label: string): string {
  return label
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
}

function synonymKeys(phrases: readonly string[]): Set<string> {
  return new Set(phrases.map((p) => headerMatchKey(p)))
}

/** Synonyms for the core email column (match keys are derived via `headerMatchKey`). */
const EMAIL_SYNONYMS = synonymKeys([
  'email',
  'e-mail',
  'mail',
  'work email',
  'work_email',
  'workEmail',
  'email address',
  'email_address',
  'primary email',
  'primary_email',
  'business email',
  'business_email',
  'office email',
  'office_email',
  'contact email',
  'contact_email',
  'personal email',
  'personal_email',
  'corp email',
  'corporate_email',
])

const FIRST_NAME_SYNONYMS = synonymKeys([
  'first name',
  'firstname',
  'first_name',
  'given name',
  'given_name',
  'givenname',
  'fname',
  'forename',
  'first',
])

const LAST_NAME_SYNONYMS = synonymKeys([
  'last name',
  'lastname',
  'last_name',
  'family name',
  'family_name',
  'familyname',
  'surname',
  'lname',
  'last',
])

/**
 * Finds which file headers correspond to canonical contact columns.
 * Earlier columns win when multiple headers match the same role.
 */
const detectCanonicalColumns = (headers: string[]): CanonicalColumns => {
  const detected: CanonicalColumns = {}
  const used = new Set<string>()

  for (const h of headers) {
    if (
      used.has(h) ||
      detected.email ||
      !EMAIL_SYNONYMS.has(headerMatchKey(h))
    ) {
      continue
    }
    detected.email = h
    used.add(h)
  }
  for (const h of headers) {
    if (
      used.has(h) ||
      detected.first_name ||
      !FIRST_NAME_SYNONYMS.has(headerMatchKey(h))
    ) {
      continue
    }
    detected.first_name = h
    used.add(h)
  }
  for (const h of headers) {
    if (
      used.has(h) ||
      detected.last_name ||
      !LAST_NAME_SYNONYMS.has(headerMatchKey(h))
    ) {
      continue
    }
    detected.last_name = h
    used.add(h)
  }

  return detected
}

/** Undetected canonical roles use empty string; `varying` lists headers not used as canonical when `allHeaders` is passed. */
export function canonicalColumnsToColumnMapping(
  canonicalColumns: CanonicalColumns,
  allHeaders?: readonly string[]
): ColumnMapping {
  const canonical: ColumnMapping['canonical'] = {
    email: canonicalColumns.email ?? '',
    first_name: canonicalColumns.first_name ?? '',
    last_name: canonicalColumns.last_name ?? '',
  }
  const used = new Set(
    [
      canonicalColumns.email,
      canonicalColumns.first_name,
      canonicalColumns.last_name,
    ].filter((h): h is string => typeof h === 'string' && h.length > 0)
  )
  const varying = allHeaders?.filter((h) => !used.has(h)) ?? []
  return { canonical, varying }
}

/**
 * Auto detection of column mapping from headers.
 * It's a best-effort defaults that can be overridden by the user.
 * Returns:
 *  - canonical columns
 *  - varying columns
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
export function autoDetectColumnMapping(headers: string[]): ColumnMapping {
  const d = detectCanonicalColumns(headers)
  const columnMapping = canonicalColumnsToColumnMapping(d, headers)

  return columnMapping
}

/**
 * Ensures that there is exactly one email mapping.
 */
export function countEmailMappings(columnMap: ColumnMapping): number {
  return Object.values(columnMap.canonical).filter((v) => v === 'email').length
}
