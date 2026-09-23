'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatPeer, CurrentUser, DmConversation, Fan } from '@/lib/api-types'
import { refreshUnreadChats } from '@/lib/unread-chats'
import { ChatEmptyState } from './chat-empty-state'
import { ChatSidebar } from './chat-sidebar'
import { ChatThread } from './chat-thread'

/** How often the list refreshes while the page is open. */
const LIST_POLL_MS = 8_000

/** The welcome note every account sees at the top, like the reference's own row. */
export const WELCOME_CHAT_ID = 'beem-welcome'

type Props = {
  user: CurrentUser
  /** Conversation to open straight away, from /chats?c=<id>. */
  initialChatId?: string | null
}

export function ChatWorkspace({ user, initialChatId = null }: Props) {
  const [conversations, setConversations] = useState<DmConversation[]>([])
  const [suggested, setSuggested] = useState<ChatPeer[]>([])
  const [fans, setFans] = useState<Fan[]>([])
  const [loaded, setLoaded] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(initialChatId)
  const [error, setError] = useState<string | null>(null)
  const selectedRef = useRef(selectedId)
  selectedRef.current = selectedId

  const refresh = useCallback(async () => {
    const [list, people, followers] = await Promise.all([
      fetch('/api/chats').then((r) => (r.ok ? (r.json() as Promise<DmConversation[]>) : [])),
      fetch('/api/chats/suggested').then((r) => (r.ok ? (r.json() as Promise<ChatPeer[]>) : [])),
      fetch('/api/follows/fans').then((r) => (r.ok ? (r.json() as Promise<Fan[]>) : [])),
    ]).catch(() => [[], [], []] as [DmConversation[], ChatPeer[], Fan[]])
    setConversations(list)
    setSuggested(people)
    setFans(followers)
    // Opening a thread marks it read; the badges in the header should follow.
    refreshUnreadChats()
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
        fans={fans}
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
