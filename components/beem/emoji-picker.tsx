'use client'

import { useEffect, useRef } from 'react'

/** A small, dependency-free set; enough for reactions in chat. */
const EMOJI = [
  '😀', '😂', '🥰', '😍', '😘', '😎', '🤩', '🥳', '😭', '😡', '🤔', '🙄',
  '👋', '👍', '👏', '🙏', '💪', '🔥', '✨', '🎉', '💯', '❤️', '💕', '💔',
  '😢', '😱', '🤣', '😇', '😴', '🤗', '💋', '🌹', '🎁', '💎', '👑', '🚀',
]

type Props = {
  onPick: (emoji: string) => void
  onClose: () => void
  /** 'dark' for the live room, 'light' for messages. */
  tone?: 'dark' | 'light'
}

export function EmojiPicker({ onPick, onClose, tone = 'light' }: Props) {
  const panel = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Element
      if (panel.current && !panel.current.contains(target) && !target.closest?.('[data-emoji-toggle]')) onClose()
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div ref={panel} className={`emoji-picker emoji-picker--${tone}`} role="dialog" aria-label="Emoji">
      {EMOJI.map((emoji) => (
        <button type="button" key={emoji} onClick={() => onPick(emoji)} aria-label={emoji}>
          {emoji}
        </button>
      ))}
    </div>
  )
}
