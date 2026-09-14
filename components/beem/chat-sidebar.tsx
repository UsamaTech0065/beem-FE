'use client'

import { useState } from 'react'
import { Heart, Inbox, Plus, Search, SquarePen } from 'lucide-react'
import { chats } from './chat-data'
import { ChatRow } from './chat-row'

const FILTERS = ['All', 'Unread', 'Favorites'] as const
type Filter = (typeof FILTERS)[number]

export function ChatSidebar({
  selectedName,
  onSelect,
}: {
  selectedName: string
  onSelect: (name: string) => void
}) {
  const [filter, setFilter] = useState<Filter>('All')
  const [query, setQuery] = useState('')

  const visible = chats.filter((chat) => {
    if (filter === 'Unread' && !chat.unread) return false
    if (filter === 'Favorites' && !chat.favorite) return false
    if (query && !chat.name.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

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
        <button type="button" aria-label="Message requests">
          <Inbox size={21} strokeWidth={1.9} />
        </button>
        <button type="button" aria-label="New message">
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
        <button type="button" className="chat-filter-add" aria-label="Add filter">
          <Plus size={17} strokeWidth={2.2} />
        </button>
      </div>

      <div className="chat-list">
        {visible.map((chat) => (
          <ChatRow
            key={`${chat.name}-${chat.time}`}
            chat={chat}
            selected={selectedName === chat.name}
            onSelect={() => onSelect(chat.name)}
          />
        ))}
      </div>
    </aside>
  )
}
