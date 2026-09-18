'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, Gift, Loader2, Lock, SquarePlus, Star, Trash2 } from 'lucide-react'
import type { DmConversation, ProfilePage, ProfilePost } from '@/lib/api-types'
import { SignInDialog } from './sign-in-dialog'
import { UserAvatar } from './user-avatar'

type Props = {
  profile: ProfilePage
  posts: ProfilePost[]
  /** The post that was clicked on the profile; the feed opens scrolled to it. */
  focusId: string | null
  signedIn: boolean
}

const FAN_NOTICE = 'Fan subscriptions are coming soon.'

/** Someone's posts, one under another at full size. Opened by clicking a tile on their profile. */
export function PostFeed({ profile, posts, focusId, signedIn }: Props) {
  const router = useRouter()
  const [signInOpen, setSignInOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const formatTime = usePostTimeFormat()

  useEffect(() => {
    if (focusId) document.getElementById(`post-${focusId}`)?.scrollIntoView({ block: 'start' })
  }, [focusId])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(timer)
  }, [toast])

  function becomeFan() {
    if (!signedIn) return setSignInOpen(true)
    setToast(FAN_NOTICE)
  }

  /** Gifts are sent from the conversation, where the gift strip lives. */
  async function sendGift(post: ProfilePost) {
    if (!signedIn) return setSignInOpen(true)
    setBusy(post.id)
    const response = await fetch('/api/chats', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId: profile.id }),
    }).catch(() => null)
    if (!response?.ok) {
      setBusy(null)
      return setToast('Could not open the chat. Try again.')
    }
    const conversation = (await response.json()) as DmConversation
    router.push(`/chats?c=${encodeURIComponent(conversation.id)}`)
  }

  async function remove(post: ProfilePost) {
    if (!window.confirm('Delete this post? This cannot be undone.')) return
    setBusy(post.id)
    const response = await fetch(`/api/posts/${encodeURIComponent(post.id)}`, { method: 'DELETE' }).catch(() => null)
    setBusy(null)
    if (!response?.ok) return setToast('Could not delete the post. Try again.')
    // Deleting the last one leaves nothing to look at here.
    if (posts.length === 1) router.replace(`/${profile.handle}`)
    router.refresh()
  }

  return (
    <main className="feed">
      <Link href={`/${profile.handle}`} className="fp-back feed-back" aria-label={`Back to ${profile.displayName}'s profile`}>
        <ArrowLeft size={24} strokeWidth={2} />
      </Link>

      <div className="feed-col">
        <header className="feed-head">
          <h1>Posts</h1>
          <Link href={`/${profile.handle}`}>@{profile.handle}</Link>
        </header>

        {posts.length === 0 && <p className="feed-none">No Posts</p>}

        {posts.map((post) => (
          <article key={post.id} id={`post-${post.id}`} className="feed-post">
            <Link href={`/${profile.handle}`} className="feed-author">
              <UserAvatar src={profile.avatarUrl} name={profile.displayName} size={42} />
              <span>
                <strong>{profile.displayName}</strong>
                <time dateTime={post.createdAt}>{formatTime(post.createdAt)}</time>
              </span>
            </Link>

            {post.locked ? (
              <div className="feed-locked">
                <span className="feed-locked-icon" aria-hidden="true">
                  <Star size={46} fill="currentColor" strokeWidth={0} />
                  <Lock size={20} strokeWidth={2.6} />
                </span>
                <button type="button" onClick={becomeFan}>
                  <Star size={20} fill="currentColor" strokeWidth={0} /> Become a Fan
                </button>
              </div>
            ) : (
              post.mediaUrl && <img src={post.mediaUrl} alt="" className="feed-media" />
            )}

            <div className="feed-bar">
              {post.fansOnly && (
                <b>
                  <Star size={12} strokeWidth={2.4} /> Fans
                </b>
              )}
              {profile.isSelf ? (
                <button type="button" onClick={() => remove(post)} disabled={busy === post.id} aria-label="Delete post">
                  {busy === post.id ? <Loader2 size={20} className="auth-spin" /> : <Trash2 size={20} strokeWidth={1.8} />}
                </button>
              ) : (
                <button type="button" onClick={() => sendGift(post)} disabled={busy === post.id} aria-label="Send a gift">
                  {busy === post.id ? <Loader2 size={20} className="auth-spin" /> : <Gift size={22} strokeWidth={1.8} />}
                </button>
              )}
            </div>

            {!post.locked && post.text && <p className={post.mediaUrl ? 'feed-text' : 'feed-text feed-text--only'}>{post.text}</p>}
          </article>
        ))}
      </div>

      <div className="feed-side">
        {profile.isSelf ? (
          <Link href="/create-post" className="feed-cta feed-cta--own">
            <SquarePlus size={20} strokeWidth={2} /> Create Post
          </Link>
        ) : (
          <button type="button" className="feed-cta" onClick={becomeFan}>
            <Star size={22} fill="currentColor" strokeWidth={0} /> Become a Fan
          </button>
        )}
      </div>

      {toast && (
        <div className="profile-toast" role="status">
          {toast}
        </div>
      )}
      {signInOpen && <SignInDialog onClose={() => setSignInOpen(false)} />}
    </main>
  )
}

/**
 * "July 20, 3:13 AM" in the reader's own time zone. The server cannot know
 * that zone, so the first paint uses UTC (matching the server's HTML) and the
 * local time takes over once mounted.
 */
function usePostTimeFormat(): (iso: string) => string {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const zone = mounted ? {} : { timeZone: 'UTC' }
  // Two formatters: a single one joins the parts with "at" rather than a comma.
  const day = new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', ...zone })
  const time = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit', ...zone })
  return (iso) => {
    const date = new Date(iso)
    return `${day.format(date)}, ${time.format(date)}`
  }
}
