'use client'

import { useState } from 'react'
import { chats, type ChatItem } from './chat-data'
import { ChatEmptyState } from './chat-empty-state'
import { ChatSidebar } from './chat-sidebar'
import { ChatThread } from './chat-thread'

/**
 * Still rendering fixture data — there is no messaging API yet. Kept isolated
 * so it is obvious which part of the app is not wired to the backend.
 */
export function ChatWorkspace() {
  const [selected, setSelected] = useState<ChatItem | null>(null)

  return (
    <div className={`chat-workspace ${selected ? 'has-thread' : ''}`}>
      <ChatSidebar
        selectedName={selected?.name ?? ''}
        onSelect={(name) => setSelected(chats.find((chat) => chat.name === name) ?? null)}
      />
      {selected ? <ChatThread chat={selected} /> : <ChatEmptyState selected="" />}
    </div>
  )
}
