import { parse as papaParse } from 'papaparse'

/**
 * Parsed row from the CSV file.
 * Contains canonical columns and varying columns.
 */
export type ParsedRow = {
  rowNumber: number
  row: Record<string, string>
  metadata:
    | { parsed: true }
    | {
        parsed: false
        error: {
          cause: 'Quotes' | 'Delimiter' | 'FieldMismatch'
          code:
            | 'MissingQuotes'
            | 'UndetectableDelimiter'
            | 'TooFewFields'
            | 'TooManyFields'
            | 'InvalidQuotes'
          message: string
        }
      }
}

export type ParsedHeaderRowIndex = Record<string, string>
export type ParsedBuffer = ParsedRow[]

export type OnHeaderRowParsedCallback = (params: { headers: string[] }) => void

export type OnEmitBufferCallback = (params: {
  buffer: ParsedBuffer
  done: boolean
}) => void

export type ParseError =
  | {
      type: 'INVALID_HEADER'
      reason: string
    }
  | {
      type: 'FILE_READER_ERROR'
      code: string
      message: string
    }
export type OnParseErrorCallback = (err: ParseError) => void

/**
 * Batch parser options
 */
export type BatchParserOptions = {
  /**
   * Number of rows to parse in a single batch
   * @default 500
   */
  batchSize?: number
  /**
   * Size of each chunk to emit
   * @default 1MB
   */
  chunkSize?: number
  /**
   * Callback when the header row is parsed
   */
  onHeaderRowParsed: OnHeaderRowParsedCallback
  /**
   * Callback when a buffer of parsed rows is ready to be emitted
   */
  onEmitBuffer: OnEmitBufferCallback
  /**
   * Callback when a parsing error occurs
   */
  onParseError: OnParseErrorCallback
}

/**
 * CSV parser parsing fils as a batch
 * chunks are emitted as they are parsed
 */
export class BatchParser {
  readonly #file: File

  readonly #batchSize: number
  readonly #chunkSize: number

  readonly #onHeaderRowParsed: OnHeaderRowParsedCallback
  readonly #onEmitBuffer: OnEmitBufferCallback
  readonly #onParseError: OnParseErrorCallback

  #headerRowDetected = false

  #currentParsedRowNumber = 0
  #buffer: ParsedBuffer = []

  constructor(file: File, options: BatchParserOptions) {
    this.#file = file

    this.#batchSize = options.batchSize ?? 50
    this.#chunkSize = options.chunkSize ?? 1024 * 1024

    this.#onHeaderRowParsed = options.onHeaderRowParsed
    this.#onEmitBuffer = options.onEmitBuffer
    this.#onParseError = options.onParseError
  }

  #flush(done: boolean): void {
    if (this.#buffer.length <= 0 && !done) {
      return
    }
    this.#onEmitBuffer({ buffer: this.#buffer, done })
    this.#buffer = []
  }

  #_parse(): void {
    papaParse(this.#file, {
      header: true, // 👈🏻 first line should be always the header row
      skipEmptyLines: 'greedy',
      worker: false, // 👈🏻 by design this parser is already used in a web worker.
      chunkSize: this.#chunkSize,
      chunk: (results, parser) => {
        const fields = results.meta.fields ?? []
        if (fields.length <= 0) {
          parser.abort()

          this.#onParseError({
            type: 'INVALID_HEADER',
            reason: `CSV file '${this.#file.name}' has no fields in the header. Please check the mapping and try again.`,
          })
          return
        } else {
          if (!this.#headerRowDetected) {
            this.#onHeaderRowParsed({ headers: fields })
            this.#headerRowDetected = true
          }
        }

        for (let i = 0; i < results.data.length; i++) {
          const row = results.data[i]
          const error = results.errors[i]

          this.#currentParsedRowNumber++

          this.#buffer.push({
            rowNumber: this.#currentParsedRowNumber,
            row: row as Record<string, string>,
            metadata: error
              ? {
                  parsed: false,
                  error: {
                    cause: error.type,
                    code: error.code,
                    message: error.message,
                  },
                }
              : { parsed: true },
          })

          if (this.#buffer.length >= this.#batchSize) {
            this.#flush(false)
          }
        }
      },
      complete: () => {
        this.#flush(true)
      },
      error: (err) => {
        this.#onParseError({
          type: 'FILE_READER_ERROR',
          code: err.name,
          message: err.message,
        })
      },
    })
  }

  /* start batch parsing */
  parse(): void {
    this.#_parse()
  }
}

/**
 * Simple factory function to create and start a new batch parser
 * @example
 * ```ts
 * batchParse(file, {
 *   batchSize: 1000,
 *   chunkSize: 1024 * 1024, // 1MB
 *   onParseError: (error) => {
 *     console.error(error)
 *   },
 *   onEmitBuffer: (buffer, done) => {
 *     console.log(buffer)
 *     console.log(done)
 *   },
 * })
 * ```
 */
export function batchParse(file: File, options: BatchParserOptions): void {
  const parser = new BatchParser(file, options)
  parser.parse()
}
