'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Gift as GiftIcon,
  Image as ImageIcon,
  Mic,
  MoreHorizontal,
  Package,
  Plus,
  SendHorizontal,
  Smile,
  Star,
  Video,
} from 'lucide-react'
import type { CurrentUser, DmConversation, DmMessage } from '@/lib/api-types'
import { ChatContentPacks } from './chat-content-packs'
import { EmojiPicker } from './emoji-picker'
import { GIFTS } from './gift-panel'
import { UserAvatar } from './user-avatar'

/** How often an open thread asks for newer messages. */
const THREAD_POLL_MS = 3_000
const QUICK_GIFTS = GIFTS.slice(0, 8)

type Props = {
  me: CurrentUser
  /** Null renders the welcome note from beem itself. */
  conversation: DmConversation | null
  onBack: () => void
  /** Called after anything that changes the list: a send, a favourite. */
  onChanged?: () => void
}

export function ChatThread({ me, conversation, onBack, onChanged }: Props) {
  const [messages, setMessages] = useState<DmMessage[]>([])
  const [loaded, setLoaded] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [favorite, setFavorite] = useState(Boolean(conversation?.favorite))
  const [packsOpen, setPacksOpen] = useState(false)
  const [giftsOpen, setGiftsOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const scroller = useRef<HTMLDivElement | null>(null)
  const draftInput = useRef<HTMLInputElement | null>(null)
  const newestRef = useRef<string | null>(null)

  const conversationId = conversation?.id ?? null

  const fetchMessages = useCallback(
    async (after: string | null) => {
      if (!conversationId) return
      const query = after ? `?after=${encodeURIComponent(after)}` : ''
      const response = await fetch(`/api/chats/${conversationId}/messages${query}`).catch(() => null)
      if (!response?.ok) return
      const rows = (await response.json()) as DmMessage[]
      if (rows.length === 0) return setLoaded(true)

      newestRef.current = rows[rows.length - 1].createdAt
      setMessages((current) => {
        const seen = new Set(current.map((message) => message.id))
        const fresh = rows.filter((message) => !seen.has(message.id))
        return after ? [...current, ...fresh] : rows
      })
      setLoaded(true)
      if (after && rows.some((message) => message.senderId !== me.id)) onChanged?.()
    },
    [conversationId, me.id, onChanged],
  )

  // Initial load, then poll for anything newer while the tab is visible.
  useEffect(() => {
    if (!conversationId) return setLoaded(true)
    setMessages([])
    setLoaded(false)
    newestRef.current = null
    void fetchMessages(null)
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void fetchMessages(newestRef.current)
    }, THREAD_POLL_MS)
    return () => clearInterval(timer)
  }, [conversationId, fetchMessages])

  useEffect(() => {
    const element = scroller.current
    if (element) element.scrollTop = element.scrollHeight
  }, [messages, loaded])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(timer)
  }, [toast])

  async function send(text: string, kind: 'TEXT' | 'HI' = 'TEXT') {
    if (!conversationId || sending) return
    setSending(true)
    const response = await fetch(`/api/chats/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, kind }),
    }).catch(() => null)
    setSending(false)

    if (!response?.ok) return setToast('Could not send. Try again.')
    const message = (await response.json()) as DmMessage
    newestRef.current = message.createdAt
    setMessages((current) => [...current, message])
    setDraft('')
    onChanged?.()
  }

  async function toggleFavorite() {
    if (!conversationId) return
    const next = !favorite
    setFavorite(next)
    const response = await fetch(`/api/chats/${conversationId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ favorite: next }),
    }).catch(() => null)
    if (!response?.ok) setFavorite(!next)
    else onChanged?.()
  }

  function comingSoon(what: string) {
    setToast(`${what} arrives with coins in the next update.`)
  }

  // ---- welcome note from beem ----
  if (!conversation) {
    return (
      <section className="chat-thread" aria-label="Welcome from beem">
        <header className="thread-header">
          <button type="button" className="thread-back" onClick={onBack} aria-label="Back to chats">
            <ChevronLeft size={24} />
          </button>
          <span className="chat-avatar chat-avatar--brand thread-avatar" aria-hidden="true">
            b
          </span>
          <div className="thread-title">
            <h2>beem</h2>
            <span>Official</span>
          </div>
        </header>
        <div className="thread-scroll" ref={scroller}>
          <div className="msg msg--theirs">
            <p>
              Welcome to beem, {me.displayName}! 🎉 This is your new home for live moments. Follow creators you
              like, tap into their lives, and say hi to anyone from the Suggested creators list.
            </p>
          </div>
          <div className="msg msg--theirs">
            <p>
              Want to go live yourself? Press the pink camera button. Your followers see you in their feed the moment
              you start.
            </p>
          </div>
        </div>
      </section>
    )
  }

  const { peer } = conversation
  const empty = loaded && messages.length === 0

  return (
    <section className="chat-thread" aria-label={`Conversation with ${peer.displayName}`}>
      <header className="thread-header">
        <button type="button" className="thread-back" onClick={onBack} aria-label="Back to chats">
          <ChevronLeft size={24} />
        </button>
        <span className={`chat-avatar-wrap${peer.liveStreamId ? ' is-live' : ''}`}>
          <UserAvatar className="thread-avatar" src={peer.avatarUrl} name={peer.displayName} size={50} />
        </span>
        <div className="thread-title">
          <h2>{peer.displayName}</h2>
          {peer.liveStreamId ? (
            <Link href={`/stream/${peer.liveStreamId}`} className="thread-live">
              Live now
            </Link>
          ) : (
            <span>@{peer.handle}</span>
          )}
        </div>
        <button
          type="button"
          className={`thread-star${favorite ? ' is-on' : ''}`}
          onClick={toggleFavorite}
          aria-pressed={favorite}
          aria-label={favorite ? 'Remove from favourites' : 'Add to favourites'}
        >
          <Star size={20} fill={favorite ? 'currentColor' : 'none'} strokeWidth={2} />
        </button>
        <button type="button" className="thread-more" aria-label="Conversation options" disabled title="Coming soon">
          <MoreHorizontal size={22} />
        </button>
      </header>

      <div className="thread-scroll" ref={scroller}>
        {empty ? (
          <div className="thread-intro">
            <UserAvatar src={peer.avatarUrl} name={peer.displayName} size={70} />
            <strong>{peer.displayName}</strong>
            <span className="thread-wave" aria-hidden="true">
              👋
            </span>
            <button type="button" className="thread-sayhi" onClick={() => send('👋', 'HI')} disabled={sending}>
              Tap to say hi
            </button>
          </div>
        ) : (
          messages.map((message) => {
            const mine = message.senderId === me.id
            if (message.kind === 'HI') {
              return (
                <div key={message.id} className="msg-hi">
                  <span aria-hidden="true">👋</span>
                  {mine ? 'You said hi' : `${peer.displayName} said hi`}
                </div>
              )
            }
            return (
              <div key={message.id} className={`msg ${mine ? 'msg--mine' : 'msg--theirs'}`}>
                <p>{message.text}</p>
                <time dateTime={message.createdAt}>
                  {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </time>
              </div>
            )
          })
        )}
      </div>

      <div className="thread-foot">
        {peer.liveStreamId && (
          <Link href={`/stream/${peer.liveStreamId}`} className="thread-join">
            <Video size={18} strokeWidth={2.2} /> {peer.displayName} is live. Join
          </Link>
        )}

        <div className="composer">
          <div className="dm-gift-strip">
            <button type="button" className="dm-gift-arrow" aria-label="Previous gifts" disabled>
              <ChevronLeft size={20} strokeWidth={2.2} />
            </button>
            <ul className="dm-gift-list">
              {QUICK_GIFTS.map((gift) => (
                <li key={gift.name}>
                  <button type="button" onClick={() => comingSoon(`${gift.name} (${gift.coins} coins)`)} aria-label={`Send ${gift.name} for ${gift.coins} coins`}>
                    <span className="dm-gift-emoji" aria-hidden="true">
                      {gift.emoji}
                    </span>
                    <span className="dm-gift-price">
                      <span className="tg-coin" aria-hidden="true" />
                      {gift.coins.toLocaleString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="dm-gift-arrow" aria-label="More gifts" onClick={() => setGiftsOpen(true)}>
              <ChevronRight size={20} strokeWidth={2.2} />
            </button>
          </div>

          <form
            className="composer-row"
            onSubmit={(event) => {
              event.preventDefault()
              if (draft.trim()) void send(draft.trim())
            }}
          >
            <button type="button" className="composer-add" aria-label="Content packs" onClick={() => setPacksOpen(true)}>
              <Plus size={24} strokeWidth={2.2} />
            </button>

            <label className="composer-input">
              <input
                ref={draftInput}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Message..."
                aria-label="Message"
                maxLength={2000}
              />
              <button
                type="button"
                className={`composer-emoji${emojiOpen ? ' is-on' : ''}`}
                aria-label="Emoji"
                aria-expanded={emojiOpen}
                data-emoji-toggle
                onClick={() => setEmojiOpen((open) => !open)}
              >
                <Smile size={22} strokeWidth={1.9} />
              </button>
              {emojiOpen && (
                <EmojiPicker
                  onPick={(emoji) => {
                    setDraft((current) => `${current}${emoji}`)
                    draftInput.current?.focus()
                  }}
                  onClose={() => setEmojiOpen(false)}
                />
              )}
            </label>

            {draft.trim() ? (
              <button type="submit" className="composer-send" aria-label="Send" disabled={sending}>
                <SendHorizontal size={20} />
              </button>
            ) : (
              <>
                <button type="button" className="composer-icon" aria-label="Content packs" onClick={() => setPacksOpen(true)}>
                  <Package size={22} strokeWidth={1.9} />
                </button>
                <button type="button" className="composer-icon" aria-label="Send a photo" disabled title="Coming soon">
                  <ImageIcon size={22} strokeWidth={1.9} />
                </button>
                <button type="button" className="composer-icon" aria-label="Voice message" disabled title="Coming soon">
                  <Mic size={22} strokeWidth={1.9} />
                </button>
                <button type="button" className="composer-icon" aria-label="Send a gift" onClick={() => setGiftsOpen(true)}>
                  <GiftIcon size={22} strokeWidth={1.9} />
                </button>
              </>
            )}
          </form>
        </div>
      </div>

      {giftsOpen && (
        <div className="dm-gifts" role="dialog" aria-label="Gifts">
          <header>
            <button type="button" className="gifts-create" disabled title="Custom gifts are coming soon">
              <Plus size={16} /> Create
            </button>
            <span className="gifts-balance">
              <span className="tg-coin" aria-hidden="true" /> 0
            </span>
            <button type="button" className="dm-gifts-close" onClick={() => setGiftsOpen(false)} aria-label="Close gifts">
              ×
            </button>
          </header>
          <p className="gifts-category">Classic</p>
          <div className="dm-gifts-grid">
            {GIFTS.map((gift) => (
              <button type="button" key={gift.name} className="gift" onClick={() => comingSoon(`${gift.name} (${gift.coins} coins)`)}>
                <span className="gift-emoji" aria-hidden="true">
                  {gift.emoji}
                </span>
                <span className="gift-price">
                  <span className="tg-coin" aria-hidden="true" /> {gift.coins.toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {packsOpen && <ChatContentPacks onClose={() => setPacksOpen(false)} onSend={() => comingSoon('Content packs')} />}

      {toast && (
        <div className="live-toast" role="status">
          {toast}
        </div>
      )}
    </section>
  )
}
