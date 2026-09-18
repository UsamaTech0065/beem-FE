'use client'

import { useEffect, useRef, useState } from 'react'
import { SendHorizontal, Smile } from 'lucide-react'
import type { ChatMessage } from '@/lib/use-live-room'
import { EmojiPicker } from './emoji-picker'
import { UserAvatar } from './user-avatar'

type Props = {
  messages: ChatMessage[]
  /** Null when the visitor is signed out; the input then offers sign-in instead. */
  me: { avatarUrl: string | null; name: string } | null
  onSend: (text: string) => Promise<void>
  onSignIn: () => void
  disabled?: boolean
}

/** Room chat: the last messages above a "Say something" box, bottom-left like the reference. */
export function LiveChat({ messages, me, onSend, onSignIn, disabled = false }: Props) {
  const [text, setText] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const list = useRef<HTMLOListElement | null>(null)
  const input = useRef<HTMLInputElement | null>(null)

  // Follow new messages unless the reader has scrolled up to read older ones.
  useEffect(() => {
    const element = list.current
    if (!element) return
    const nearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 80
    if (nearBottom) element.scrollTop = element.scrollHeight
  }, [messages])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    const value = text.trim()
    if (!value) return
    setText('')
    setEmojiOpen(false)
    await onSend(value)
  }

  function addEmoji(emoji: string) {
    setText((current) => `${current}${emoji}`)
    input.current?.focus()
  }

  return (
    <div className="lc">
      <ol className="lc-list" ref={list} aria-live="polite" aria-label="Chat">
        {messages.map((message) =>
          message.kind === 'follow' ? (
            <li key={message.id} className="lc-line is-follow">
              <UserAvatar src={message.avatarUrl} name={message.name} size={26} />
              <span>
                <strong>{message.name}</strong> <span className="lc-follow-tag">Follow</span> <em>Free</em>
              </span>
            </li>
          ) : (
            <li key={message.id} className={`lc-line${message.fromHost ? ' is-host' : ''}`}>
              <UserAvatar src={message.avatarUrl} name={message.name} size={26} />
              <span>
                <strong>{message.name}</strong> {message.text}
              </span>
            </li>
          ),
        )}
      </ol>

      {me ? (
        <form className="lc-box" onSubmit={submit}>
          <UserAvatar src={me.avatarUrl} name={me.name} size={40} />
          <input
            ref={input}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Say something..."
            aria-label="Chat message"
            maxLength={200}
            disabled={disabled}
          />
          <button
            type="button"
            className={`lc-icon${emojiOpen ? ' is-on' : ''}`}
            aria-label="Emoji"
            aria-expanded={emojiOpen}
            data-emoji-toggle
            onClick={() => setEmojiOpen((open) => !open)}
          >
            <Smile size={22} strokeWidth={1.8} />
          </button>
          {text.trim() && (
            <button type="submit" className="lc-icon lc-send" aria-label="Send">
              <SendHorizontal size={20} />
            </button>
          )}
          {emojiOpen && <EmojiPicker tone="dark" onPick={addEmoji} onClose={() => setEmojiOpen(false)} />}
        </form>
      ) : (
        <button type="button" className="lc-box lc-box--signin" onClick={onSignIn}>
          <UserAvatar src={null} name="?" size={40} />
          <span>Sign in to say something...</span>
        </button>
      )}
    </div>
  )
}
