import { email as emailDecoder } from 'decoders'
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
  const email_unsafe = record[columnMap.canonical.email] ?? ''
  const firstName = record[columnMap.canonical.first_name] ?? ''
  const lastName = record[columnMap.canonical.last_name] ?? ''

  const varyingFields: Record<string, string> = {}
  for (const varyingHeader of columnMap.varying) {
    varyingFields[varyingHeader] = record[varyingHeader] ?? ''
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
