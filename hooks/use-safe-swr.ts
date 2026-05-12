import { Decoder, formatShort } from 'decoders'
import useSWR, { preload } from 'swr'
import type { SWRConfiguration, SWRResponse } from 'swr'

// Without initial data provided
export function useSafeSWR<T>(
  url: string | null,
  resDecoder: Decoder<T>,
  options?: Omit<SWRConfiguration, 'fallbackData'>
): SWRResponse<T>

// With initial data provided
export function useSafeSWR<T>(
  url: string | null,
  resDecoder: Decoder<T>,
  options: Omit<SWRConfiguration, 'fallbackData'> & { initialData: T }
): Omit<SWRResponse<T>, 'data' | 'isLoading'> & {
  data: T
  isLoading: false
}

/**
 *  Safe SWR hook with optional initial data.
 *  Returns a decoded body response or an error.
 */
export function useSafeSWR<T>(
  url: string | null,
  resDecoder: Decoder<T>,
  options?: Omit<SWRConfiguration, 'fallbackData'> & { initialData?: T }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): SWRResponse<T, any> {
  const { initialData, ...swrOpts } = options ?? {}
  const swr = useSWR<T>(
    url,
    async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(
          `An error occurred while fetching the data with status ${
            res.status
          }: ${await res.text()}`
        )
      }
      const raw = await res.json()
      return resDecoder.verify(raw, formatShort)
    },
    options
      ? ({
          ...swrOpts,
          fallbackData: initialData,
        } as SWRConfiguration)
      : undefined
  )

  return {
    ...swr,
    isLoading: initialData !== undefined ? false : swr.isLoading,
  }
}

export function preloadSWRAugmented<T>(
  url: string,
  resDecoder: Decoder<T>
): void {
  preload(url, async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(
        `An error occurred while preloading the data with status ${
          res.status
        }: ${await res.text()}`
      )
    }

    const raw = await res.json()
    return resDecoder.verify(raw, formatShort)
  })
}
