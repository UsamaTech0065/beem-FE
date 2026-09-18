'use client'

import { useState } from 'react'
import { Hand, Heart, Inbox, Plus, Search, SquarePen, Video } from 'lucide-react'
import type { ChatPeer, CurrentUser, DmConversation } from '@/lib/api-types'
import { ChatRow } from './chat-row'
import { WELCOME_CHAT_ID } from './chat-workspace'
import { UserAvatar } from './user-avatar'

const FILTERS = ['All', 'Unread', 'Favorites'] as const
type Filter = (typeof FILTERS)[number]

type Props = {
  me: CurrentUser
  conversations: DmConversation[]
  suggested: ChatPeer[]
  loaded: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  onOpenWith: (peer: ChatPeer, sayHi: boolean) => void
}

export function ChatSidebar({ me, conversations, suggested, loaded, selectedId, onSelect, onOpenWith }: Props) {
  const [filter, setFilter] = useState<Filter>('All')
  const [query, setQuery] = useState('')

  const needle = query.trim().toLowerCase()
  const visible = conversations.filter((chat) => {
    if (filter === 'Unread' && chat.unreadCount === 0) return false
    if (filter === 'Favorites' && !chat.favorite) return false
    if (needle && !chat.peer.displayName.toLowerCase().includes(needle) && !chat.peer.handle.includes(needle)) return false
    return true
  })
  const showWelcome = filter === 'All' && (!needle || 'beem'.includes(needle))

  return (
    <aside className="chat-sidebar">
      <div className="chat-toolbar">
        <div className="chat-search">
          <Search size={19} strokeWidth={2.2} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search..."
            aria-label="Search chats"
          />
        </div>
        <button type="button" aria-label="Message requests" disabled title="Message requests are coming soon">
          <Inbox size={21} strokeWidth={1.9} />
        </button>
        <button type="button" aria-label="New message" disabled title="Pick a creator below to start a chat">
          <SquarePen size={21} strokeWidth={1.9} />
        </button>
      </div>

      <div className="chat-filters" role="tablist" aria-label="Filter chats">
        {FILTERS.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={filter === name}
            className={filter === name ? 'active' : ''}
            onClick={() => setFilter(name)}
          >
            {name === 'Favorites' && <Heart size={15} fill="#e5484d" strokeWidth={0} />}
            {name}
          </button>
        ))}
        <button type="button" className="chat-filter-add" aria-label="Add filter" disabled title="Custom filters are coming soon">
          <Plus size={17} strokeWidth={2.2} />
        </button>
      </div>

      <div className="chat-list">
        {showWelcome && (
          <ChatRow
            avatar={<span className="chat-avatar chat-avatar--brand" aria-hidden="true">b</span>}
            name="beem"
            preview={`Welcome to beem, ${me.displayName}! Your new home for live moments.`}
            time="Today"
            selected={selectedId === WELCOME_CHAT_ID}
            onSelect={() => onSelect(WELCOME_CHAT_ID)}
          />
        )}

        {visible.map((chat) => (
          <ChatRow
            key={chat.id}
            avatar={
              <span className={`chat-avatar-wrap${chat.peer.liveStreamId ? ' is-live' : ''}`}>
                <UserAvatar className="chat-avatar" src={chat.peer.avatarUrl} name={chat.peer.displayName} size={64} />
              </span>
            }
            name={chat.peer.displayName}
            preview={previewFor(chat, me.id)}
            time={chat.lastMessageAt}
            unread={chat.unreadCount}
            favorite={chat.favorite}
            selected={selectedId === chat.id}
            onSelect={() => onSelect(chat.id)}
          />
        ))}

        {loaded && visible.length === 0 && filter !== 'All' && (
          <p className="chat-list-empty">Nothing {filter === 'Unread' ? 'unread' : 'favourited'} yet.</p>
        )}

        {suggested.length > 0 && filter === 'All' && !needle && (
          <section className="chat-suggested" aria-label="Suggested creators">
            <h3>Suggested creators</h3>
            {suggested.map((peer) => (
              <div key={peer.id} className="chat-suggest">
                <button type="button" className="chat-suggest-main" onClick={() => onOpenWith(peer, false)}>
                  <span className={`chat-avatar-wrap${peer.liveStreamId ? ' is-live' : ''}`}>
                    <UserAvatar className="chat-avatar" src={peer.avatarUrl} name={peer.displayName} size={64} />
                  </span>
                  <span className="chat-row-copy">
                    <strong>{peer.displayName}</strong>
                    <span>{peer.liveStreamId ? 'Live now' : 'Open to chatting'}</span>
                  </span>
                </button>
                {peer.liveStreamId ? (
                  <a className="chat-suggest-action chat-suggest-action--live" href={`/stream/${peer.liveStreamId}`}>
                    <Video size={15} strokeWidth={2.2} /> Watch live
                  </a>
                ) : (
                  <button type="button" className="chat-suggest-action" onClick={() => onOpenWith(peer, true)}>
                    <Hand size={15} strokeWidth={2.2} /> Say hi
                  </button>
                )}
              </div>
            ))}
          </section>
        )}
      </div>
    </aside>
  )
}

function previewFor(chat: DmConversation, myId: string): string {
  const last = chat.lastMessage
  if (!last) return 'Say hi to start the conversation'
  const mine = last.senderId === myId
  if (last.kind === 'HI') return mine ? 'You said hi 👋' : 'Said hi 👋'
  return mine ? `You: ${last.text}` : last.text
}
