'use client'

import { useEffect, useState } from 'react'

/**
 * How many conversations hold messages the signed-in person has not read.
 * One shared poll feeds every badge on the page (header and bottom bar), so
 * two badges do not mean two requests.
 */

const POLL_MS = 20_000

type Listener = (count: number) => void

let count = 0
const listeners = new Set<Listener>()
let timer: ReturnType<typeof setInterval> | null = null

async function load(): Promise<void> {
  const response = await fetch('/api/chats/unread').catch(() => null)
  // 401 means nobody is signed in: nothing to show.
  const payload = response?.ok ? ((await response.json().catch(() => null)) as { conversations?: number } | null) : null
  const next = payload?.conversations ?? 0
  if (next === count) return
  count = next
  for (const listener of listeners) listener(count)
}

/** Ask again now, for instance right after a thread was opened and read. */
export function refreshUnreadChats(): void {
  void load()
}

export function useUnreadChats(signedIn: boolean): number {
  const [value, setValue] = useState(count)

  useEffect(() => {
    if (!signedIn) return
    listeners.add(setValue)
    setValue(count)
    // Always ask on mount: the last answer may date from before sign-in.
    void load()
    if (!timer) {
      timer = setInterval(() => {
        if (document.visibilityState === 'visible') void load()
      }, POLL_MS)
    }
    return () => {
      listeners.delete(setValue)
      if (listeners.size === 0 && timer) {
        clearInterval(timer)
        timer = null
      }
    }
  }, [signedIn])

  return signedIn ? value : 0
}
