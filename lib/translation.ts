'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { API_URL } from './api'

/**
 * Chat translation on the reader's side. A person picks a language once;
 * incoming lines in the live room and in direct messages are then shown
 * with a translation underneath. The choice is kept in this browser.
 */

export type Language = { code: string; name: string }
export type TranslateConfig = { enabled: boolean; languages: Language[] }
export type Translation = { text: string; detected: string | null; translated: boolean }

const PREFS_KEY = 'beem_translate'
const BATCH_DELAY_MS = 120
const MAX_BATCH = 20

type Prefs = { on: boolean; lang: string }

let configPromise: Promise<TranslateConfig> | null = null

/** Asked once per page; the answer is shared by every chat on it. */
export function loadTranslateConfig(): Promise<TranslateConfig> {
  if (!configPromise) {
    configPromise = fetch(`${API_URL}/translate/config`)
      .then((response) => (response.ok ? (response.json() as Promise<TranslateConfig>) : { enabled: false, languages: [] }))
      .catch(() => ({ enabled: false, languages: [] }))
  }
  return configPromise
}

function readPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw) return JSON.parse(raw) as Prefs
  } catch {
    // Fall through to the defaults.
  }
  return { on: false, lang: guessLanguage() }
}

/** The browser's language, if it is one we can translate into. */
function guessLanguage(): string {
  const code = typeof navigator === 'undefined' ? 'en' : navigator.language.toLowerCase().split('-')[0]
  return code || 'en'
}

export type Translator = {
  /** Null until the API has answered; false when the feature is switched off on the server. */
  available: boolean | null
  languages: Language[]
  on: boolean
  lang: string
  setOn: (on: boolean) => void
  setLang: (lang: string) => void
  /** The translation for a piece of text, once it has arrived. */
  lookup: (text: string) => Translation | undefined
  /** Queue texts for translation; results show up through `lookup`. */
  request: (texts: string[]) => void
}

export function useTranslator(): Translator {
  const [config, setConfig] = useState<TranslateConfig | null>(null)
  const [prefs, setPrefs] = useState<Prefs>({ on: false, lang: 'en' })
  const [, bump] = useState(0)
  // Keyed by `${lang}\n${text}`, kept across renders and shared by nothing else.
  const cache = useRef(new Map<string, Translation>())
  const pending = useRef(new Set<string>())
  const inflight = useRef(new Set<string>())
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setPrefs(readPrefs())
    void loadTranslateConfig().then(setConfig)
  }, [])

  const available = config === null ? null : config.enabled
  const languages = useMemo(() => config?.languages ?? [], [config])
  // A saved language the server no longer offers falls back to the first offered one.
  const lang = languages.length > 0 && !languages.some((language) => language.code === prefs.lang) ? languages[0].code : prefs.lang
  const on = Boolean(available) && prefs.on

  const save = useCallback((next: Prefs) => {
    setPrefs(next)
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(next))
    } catch {
      // No storage: the choice lasts for this page only.
    }
  }, [])

  const flush = useCallback(async () => {
    timer.current = null
    const texts = [...pending.current].slice(0, MAX_BATCH)
    texts.forEach((text) => {
      pending.current.delete(text)
      inflight.current.add(text)
    })
    if (texts.length === 0) return

    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ texts, target: lang }),
    }).catch(() => null)
    const results = response?.ok ? ((await response.json().catch(() => null)) as Translation[] | null) : null

    texts.forEach((text, index) => {
      inflight.current.delete(text)
      // A failed batch is remembered as "shown as is", so it is not retried on every render.
      cache.current.set(`${lang}\n${text}`, results?.[index] ?? { text, detected: null, translated: false })
    })
    bump((n) => n + 1)
    if (pending.current.size > 0) timer.current = setTimeout(() => void flush(), BATCH_DELAY_MS)
  }, [lang])

  const request = useCallback(
    (texts: string[]) => {
      if (!on) return
      let queued = false
      for (const text of texts) {
        const trimmed = text.trim()
        if (!trimmed || cache.current.has(`${lang}\n${text}`) || inflight.current.has(text) || pending.current.has(text)) continue
        pending.current.add(text)
        queued = true
      }
      if (queued && !timer.current) timer.current = setTimeout(() => void flush(), BATCH_DELAY_MS)
    },
    [on, lang, flush],
  )

  const lookup = useCallback((text: string) => (on ? cache.current.get(`${lang}\n${text}`) : undefined), [on, lang])

  return {
    available,
    languages,
    on,
    lang,
    setOn: (value) => save({ on: value, lang }),
    setLang: (value) => save({ on: prefs.on, lang: value }),
    lookup,
    request,
  }
}
