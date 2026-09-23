'use client'

import { useEffect, useRef, useState } from 'react'
import { Languages } from 'lucide-react'
import type { Translator } from '@/lib/translation'

type Props = {
  translator: Translator
  /** 'dark' sits on the video in the live room; 'light' in the inbox. */
  tone: 'dark' | 'light'
  /** Class for the toggle button, so each place keeps its own button look. */
  buttonClassName: string
  iconSize?: number
}

/** A globe button that opens the translation switch and the language picker. */
export function TranslateMenu({ translator, tone, buttonClassName, iconSize = 20 }: Props) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Nothing to offer until the server says translation is on.
  if (!translator.available) return null

  return (
    <div className="tr-menu" ref={box}>
      <button
        type="button"
        className={`${buttonClassName}${translator.on ? ' is-on' : ''}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={translator.on ? 'Translation on. Change translation settings' : 'Translate messages'}
        title="Translate messages"
      >
        <Languages size={iconSize} strokeWidth={2} />
      </button>

      {open && (
        <div className={`tr-pop tr-pop--${tone}`} role="dialog" aria-label="Translation">
          <label className="tr-row">
            <span>
              <strong>Translate messages</strong>
              <small>Show what others write in your language</small>
            </span>
            <input type="checkbox" role="switch" checked={translator.on} onChange={(event) => translator.setOn(event.target.checked)} />
            <i aria-hidden="true" />
          </label>
          <label className="tr-lang">
            <span>Translate into</span>
            <select value={translator.lang} onChange={(event) => translator.setLang(event.target.value)}>
              {translator.languages.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
  )
}
