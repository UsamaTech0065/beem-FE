import { MessageCircleMore } from 'lucide-react'

export function ChatEmptyState({ selected }: { selected: string }) {
  return (
    <section className="chat-empty" aria-live="polite">
      <MessageCircleMore size={68} strokeWidth={1.6} />
      <p>{selected ? `Start a conversation with ${selected}` : 'Please select a chat to start messaging'}</p>
    </section>
  )
}
