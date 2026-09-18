/**
 * Timestamps the way a chat list shows them: a time today, a weekday within
 * the week, otherwise a short date. Client-side only, in the viewer's zone.
 */
export function formatChatTime(iso: string, now = new Date()): string {
  const date = new Date(iso)
  const sameDay = date.toDateString() === now.toDateString()
  if (sameDay) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const days = (now.getTime() - date.getTime()) / 86_400_000
  if (days < 6) return date.toLocaleDateString([], { weekday: 'long' })

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
