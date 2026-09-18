'use client'

import { useEffect, useRef, useState } from 'react'
import { SendHorizontal, Smile } from 'lucide-react'
import type { ChatMessage } from '@/lib/use-live-room'

const FALLBACK_AVATAR = '/placeholder-user.jpg'

type Props = {
  messages: ChatMessage[]
  /** Null when the visitor is signed out; the input then offers sign-in instead. */
  me: { avatarUrl: string | null } | null
  onSend: (text: string) => Promise<void>
  onSignIn: () => void
  disabled?: boolean
}

/** Room chat: the last messages above a "Say something" box, bottom-left like the reference. */
export function LiveChat({ messages, me, onSend, onSignIn, disabled = false }: Props) {
  const [text, setText] = useState('')
  const list = useRef<HTMLOListElement | null>(null)

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
    await onSend(value)
  }

  return (
    <div className="chat">
      <ol className="chat-list" ref={list} aria-live="polite" aria-label="Chat">
        {messages.map((message) => (
          <li key={message.id} className={`chat-line${message.fromHost ? ' is-host' : ''}`}>
            <img src={message.avatarUrl ?? FALLBACK_AVATAR} alt="" />
            <span>
              <strong>{message.name}</strong> {message.text}
            </span>
          </li>
        ))}
      </ol>

      {me ? (
        <form className="chat-box" onSubmit={submit}>
          <img src={me.avatarUrl ?? FALLBACK_AVATAR} alt="" />
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Say something..."
            aria-label="Chat message"
            maxLength={200}
            disabled={disabled}
          />
          <button type="button" className="chat-icon" aria-label="Emoji" disabled title="Coming soon">
            <Smile size={22} strokeWidth={1.8} />
          </button>
          {text.trim() && (
            <button type="submit" className="chat-icon chat-send" aria-label="Send">
              <SendHorizontal size={20} />
            </button>
          )}
        </form>
      ) : (
        <button type="button" className="chat-box chat-box--signin" onClick={onSignIn}>
          <img src={FALLBACK_AVATAR} alt="" />
          <span>Sign in to say something...</span>
        </button>
      )}
    </div>
  )
}
