'use client'

import { useCallback, useEffect, useRef } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebouncedFunction<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(fn)
  const timeoutRef = useRef<number | null>(null)

  // We need a stable reference to the callback here 👇🏻
  // eslint-disable-next-line react-hooks/refs
  callbackRef.current = fn

  // Avoid updates after being unmounted
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = window.setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    [delay]
  )
}
