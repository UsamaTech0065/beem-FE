'use client'

import type { ReactNode } from 'react'
import { Heart } from 'lucide-react'
import { formatChatTime } from '@/lib/chat-time'

type Props = {
  avatar: ReactNode
  name: string
  preview: string
  /** An ISO timestamp, or a ready-made label such as "Today". */
  time: string
  unread?: number
  favorite?: boolean
  selected: boolean
  onSelect: () => void
}

export function ChatRow({ avatar, name, preview, time, unread = 0, favorite = false, selected, onSelect }: Props) {
  const label = /^\d{4}-\d{2}-\d{2}T/.test(time) ? formatChatTime(time) : time

  return (
    <button
      type="button"
      className={`chat-row${selected ? ' chat-row-selected' : ''}`}
      aria-current={selected ? 'true' : undefined}
      onClick={onSelect}
    >
      {avatar}

      <span className="chat-row-copy">
        <strong>
          {name}
          {favorite && <Heart size={13} fill="#e5484d" strokeWidth={0} aria-label="Favourite" />}
        </strong>
        <span>{preview}</span>
      </span>

      <span className="chat-row-meta">
        <small>{label}</small>
        {unread > 0 && <b>{unread > 99 ? '99+' : unread}</b>}
      </span>
    </button>
  )
}
