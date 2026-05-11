import { email as emailDecoder } from 'decoders'

import { columnMappingRefsByIndex } from '~/lib/csv/columns'
import { type ColumnMapping } from '~/schema'

/**
 * A mapped contact import row is a row from the contact import file
 * that has been mapped to the canonical contact fields and varying fields.
 */
export type MappedContactImportRow = {
  email: string
  firstName: string
  lastName: string
  varyingFields: Record<string, string>
}

/**
 * Map a CSV record to a contact import row.
 * based on the column mapping defined in the contact import.
 */
export function mapContactImportRow({
  record,
  columnMap,
}: {
  record: Record<string, string>
  columnMap: ColumnMapping
}): MappedContactImportRow | null {
  let email_unsafe = ''
  let firstName = ''
  let lastName = ''

  const varyingFields: Record<string, string> = {}

  for (const col of columnMappingRefsByIndex(columnMap)) {
    const cell = record[col.value] ?? ''
    if (col.kind === 'canonical') {
      if (col.field === 'email') {
        email_unsafe = cell
      } else if (col.field === 'first_name') {
        firstName = cell
      } else {
        lastName = cell
      }
    } else {
      varyingFields[col.value] = cell
    }
  }

  const decoderResult = emailDecoder.decode(email_unsafe)
  if (!decoderResult.ok) {
    return null
  }

  return {
    email: decoderResult.value,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    varyingFields,
  }
}
