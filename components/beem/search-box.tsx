'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Search, X } from 'lucide-react'
import type { SearchResults } from '@/lib/api-types'
import { UserAvatar } from './user-avatar'

const DEBOUNCE_MS = 220
const QUICK_PEOPLE = 10

type Props = {
  /** Pre-filled on the results page, so the box shows what was searched. */
  initialQuery?: string
  className: string
  iconSize?: number
  autoFocus?: boolean
}

/**
 * The header search. Typing lists the first people that match, like the
 * reference; Enter (or "See all results") opens /search with people and
 * live streams.
 */
export function SearchBox({ initialQuery = '', className, iconSize = 18, autoFocus }: Props) {
  const router = useRouter()
  const listId = useId()
  const box = useRef<HTMLFormElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResults | null>(null)
  const [open, setOpen] = useState(false)

  const term = query.trim()

  // Quick results, a moment after the person stops typing. Stale answers are
  // dropped: a slow reply to "ru" must not overwrite the reply to "ruby".
  useEffect(() => {
    if (!term) return setResults(null)
    let current = true
    const timer = setTimeout(async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`).catch(() => null)
      if (!current || !response?.ok) return
      setResults((await response.json()) as SearchResults)
    }, DEBOUNCE_MS)
    return () => {
      current = false
      clearTimeout(timer)
    }
  }, [term])

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!term) return
    setOpen(false)
    router.push(`/search?q=${encodeURIComponent(term)}`)
  }

  function clear() {
    setQuery('')
    setResults(null)
    input.current?.focus()
  }

  const people = results?.people.slice(0, QUICK_PEOPLE) ?? []
  const showList = open && term.length > 0 && results !== null && results.query === term

  return (
    <form ref={box} className={`${className} search-form${query ? ' has-text' : ''}`} role="search" onSubmit={submit}>
      <Search size={iconSize} strokeWidth={2.2} />
      <input
        ref={input}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => event.key === 'Escape' && setOpen(false)}
        placeholder="Search"
        aria-label="Search people and live streams"
        aria-controls={listId}
        aria-expanded={showList}
        autoComplete="off"
        autoFocus={autoFocus}
        enterKeyHint="search"
      />
      {query && (
        <button type="button" className="search-clear" onClick={clear} aria-label="Clear search">
          <X size={16} strokeWidth={2.2} />
        </button>
      )}

      {showList && (
        <div className="search-drop" id={listId}>
          {people.length === 0 ? (
            <p className="search-drop-empty">Nothing found for &ldquo;{term}&rdquo;</p>
          ) : (
            <>
              {people.map((person) => (
                <Link key={person.id} href={`/${person.handle}`} className="search-hit" onClick={() => setOpen(false)}>
                  <UserAvatar src={person.avatarUrl} name={person.displayName} size={34} />
                  <span className="search-hit-name">{person.displayName}</span>
                  {person.liveStreamId && <b className="search-hit-live">LIVE</b>}
                </Link>
              ))}
              <button type="submit" className="search-drop-all">
                See all results
              </button>
            </>
          )}
        </div>
      )}
    </form>
  )
}
