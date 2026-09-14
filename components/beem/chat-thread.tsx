'use client'

import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Gift as GiftIcon,
  Image as ImageIcon,
  Languages,
  Lock,
  Mic,
  MoreHorizontal,
  Plus,
  Smile,
  Video,
} from 'lucide-react'
import { gifts, thread, type ChatItem } from './chat-data'

const UNLOCK_CHAT_COINS = 99

export function ChatThread({ chat }: { chat: ChatItem }) {
  const [draft, setDraft] = useState('')

  return (
    <section className="chat-thread" aria-label={`Conversation with ${chat.name}`}>
      <header className="thread-header">
        {chat.avatar ? (
          <img className="thread-avatar" src={chat.avatar} alt="" />
        ) : (
          <span className="thread-avatar" />
        )}
        <h2>{chat.name}</h2>
        <button type="button" className="thread-more" aria-label="Conversation options">
          <MoreHorizontal size={22} />
        </button>
      </header>

      <div className="thread-translate">
        <button type="button">
          <Languages size={18} strokeWidth={1.9} />
          Translate all to English
        </button>
        <button type="button" className="thread-more" aria-label="Translation options">
          <MoreHorizontal size={22} />
        </button>
      </div>

      <div className="thread-scroll">
        {thread.map((message, index) => (
          <article className="locked-media" key={index}>
            <div className="locked-preview">
              {/* Blurred in CSS rather than served pre-blurred: the real build
                  must never ship the full-resolution asset to a viewer who has
                  not paid for it. This is a placeholder for that boundary. */}
              <img src={message.preview} alt="" />
            </div>
            <div className="locked-body">
              <span className="locked-label">
                <Lock size={13} strokeWidth={2.4} /> {message.label}
              </span>
              <button type="button" className="locked-unlock">
                Unlock <span className="tg-coin" aria-hidden="true" /> {message.unlockCoins}
              </button>
              <p className="locked-caption">{message.caption}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="thread-foot">
        <p className="thread-note">
          Your chat was sent as Message Request. Send a {UNLOCK_CHAT_COINS}-Coin gift for your message to
          stand out.
        </p>

        <button type="button" className="unlock-chat">
          Unlock Chat <span aria-hidden="true">🌹</span>
          <span className="tg-coin" aria-hidden="true" /> {UNLOCK_CHAT_COINS}
        </button>

        <div className="composer">
          <div className="gift-strip">
            <button type="button" className="gift-arrow" aria-label="Previous gifts">
              <ChevronLeft size={20} strokeWidth={2.2} />
            </button>
            <ul className="gift-list">
              {gifts.map((gift) => (
                <li key={gift.id}>
                  <button type="button" aria-label={`Send gift for ${gift.coins} coins`}>
                    <span className="gift-emoji" aria-hidden="true">
                      {gift.emoji}
                    </span>
                    <span className="gift-price">
                      <span className="tg-coin" aria-hidden="true" />
                      {gift.coins.toLocaleString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="gift-arrow" aria-label="More gifts">
              <ChevronRight size={20} strokeWidth={2.2} />
            </button>
          </div>

          <div className="composer-row">
            <button type="button" className="composer-add" aria-label="Attach">
              <Plus size={24} strokeWidth={2.2} />
            </button>

            <label className="composer-input">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Message..."
                aria-label="Message"
              />
              <Smile size={22} strokeWidth={1.9} />
            </label>

            <button type="button" className="composer-icon" aria-label="Send a photo">
              <ImageIcon size={22} strokeWidth={1.9} />
            </button>
            <button type="button" className="composer-icon" aria-label="Send a video">
              <Video size={22} strokeWidth={1.9} />
            </button>
            <button type="button" className="composer-icon" aria-label="Record audio">
              <Mic size={22} strokeWidth={1.9} />
            </button>
            <button type="button" className="composer-icon" aria-label="Send a gift">
              <GiftIcon size={22} strokeWidth={1.9} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
