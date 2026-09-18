'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatPeer, CurrentUser, DmConversation } from '@/lib/api-types'
import { ChatEmptyState } from './chat-empty-state'
import { ChatSidebar } from './chat-sidebar'
import { ChatThread } from './chat-thread'

/** How often the list refreshes while the page is open. */
const LIST_POLL_MS = 8_000

/** The welcome note every account sees at the top, like the reference's own row. */
export const WELCOME_CHAT_ID = 'beem-welcome'

export function ChatWorkspace({ user }: { user: CurrentUser }) {
  const [conversations, setConversations] = useState<DmConversation[]>([])
  const [suggested, setSuggested] = useState<ChatPeer[]>([])
  const [loaded, setLoaded] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const selectedRef = useRef(selectedId)
  selectedRef.current = selectedId

  const refresh = useCallback(async () => {
    const [list, people] = await Promise.all([
      fetch('/api/chats').then((r) => (r.ok ? (r.json() as Promise<DmConversation[]>) : [])),
      fetch('/api/chats/suggested').then((r) => (r.ok ? (r.json() as Promise<ChatPeer[]>) : [])),
    ]).catch(() => [[], []] as [DmConversation[], ChatPeer[]])
    setConversations(list)
    setSuggested(people)
    setLoaded(true)
  }, [])

  useEffect(() => {
    void refresh()
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, LIST_POLL_MS)
    return () => clearInterval(timer)
  }, [refresh])

  /** Start (or reopen) a conversation with someone, optionally sending the wave first. */
  async function openWith(peer: ChatPeer, sayHi: boolean) {
    setError(null)
    const response = await fetch('/api/chats', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId: peer.id }),
    }).catch(() => null)
    if (!response?.ok) return setError('Could not open that chat. Try again.')

    const conversation = (await response.json()) as DmConversation
    if (sayHi) {
      await fetch(`/api/chats/${conversation.id}/messages`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: '👋', kind: 'HI' }),
      }).catch(() => null)
    }
    setSelectedId(conversation.id)
    void refresh()
  }

  const selected = conversations.find((chat) => chat.id === selectedId) ?? null
  const showWelcome = selectedId === WELCOME_CHAT_ID

  return (
    <div className={`chat-workspace${selectedId ? ' has-thread' : ''}`}>
      <ChatSidebar
        me={user}
        conversations={conversations}
        suggested={suggested}
        loaded={loaded}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onOpenWith={openWith}
      />

      {showWelcome ? (
        <ChatThread key={WELCOME_CHAT_ID} me={user} conversation={null} onBack={() => setSelectedId(null)} />
      ) : selected ? (
        <ChatThread
          key={selected.id}
          me={user}
          conversation={selected}
          onBack={() => setSelectedId(null)}
          onChanged={refresh}
        />
      ) : (
        <ChatEmptyState selected="" />
      )}

      {error && (
        <div className="live-toast" role="status">
          {error}
        </div>
      )}
    </div>
  )
}
