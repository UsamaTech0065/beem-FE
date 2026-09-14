import type { ChatItem } from './chat-data'

export function ChatRow({
  chat,
  selected,
  onSelect,
}: {
  chat: ChatItem
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={`chat-row ${selected ? 'chat-row-selected' : ''}`}
      aria-current={selected ? 'true' : undefined}
      onClick={onSelect}
    >
      {chat.avatar ? (
        <img className="chat-avatar" src={chat.avatar} alt="" />
      ) : chat.initials ? (
        <span className={`chat-avatar chat-initials ${chat.tone ?? ''}`}>{chat.initials}</span>
      ) : (
        // No photo and no initials: an empty circle, as the reference shows for
        // a contact whose avatar has not loaded or was never set.
        <span className="chat-avatar" />
      )}

      <span className="chat-row-copy">
        <strong>{chat.name}</strong>
        <span>
          {chat.preview}
          {chat.previewBold && <> <b>{chat.previewBold}</b></>}
        </span>
      </span>

      <span className="chat-row-meta">
        <small>{chat.time}</small>
        {chat.unread && <b>{chat.unread}</b>}
      </span>
    </button>
  )
}
