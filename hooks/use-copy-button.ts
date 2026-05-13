'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export function useCopyButton(
  onCopy: () => void | Promise<void>
): [checked: boolean, onClick: React.MouseEventHandler] {
  const callbackRef = useRef(onCopy)
  const timeoutRef = useRef<number | null>(null)

  const [copied, setCopied] = useState(false)

  // We need a stable reference to the callback here 👇🏻
  // eslint-disable-next-line react-hooks/refs
  callbackRef.current = onCopy

  const onClick: React.MouseEventHandler = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    const res = Promise.resolve(callbackRef.current())

    res.then(() => {
      setCopied(true)
      timeoutRef.current = window.setTimeout(() => {
        setCopied(false)
      }, 1500)
    })
  }, [])

  // Avoid updates after being unmounted
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return [copied, onClick]
}
