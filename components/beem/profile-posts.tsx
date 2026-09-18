'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, Lock, Star, Trash2 } from 'lucide-react'
import type { ProfilePost } from '@/lib/api-types'

/** Deterministic on server and client alike: fixed locale, fixed zone. */
const dateFormat = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

type Props = {
  posts: ProfilePost[]
  /** True on your own page. */
  canDelete: boolean
  onError: (message: string) => void
}

export function ProfilePosts({ posts, canDelete, onError }: Props) {
  const router = useRouter()
  const [removing, setRemoving] = useState<string | null>(null)

  async function remove(post: ProfilePost) {
    if (!window.confirm('Delete this post? This cannot be undone.')) return
    setRemoving(post.id)
    const response = await fetch(`/api/posts/${encodeURIComponent(post.id)}`, { method: 'DELETE' }).catch(() => null)
    setRemoving(null)
    if (!response?.ok) return onError('Could not delete the post. Try again.')
    router.refresh()
  }

  return (
    <ul className="posts">
      {posts.map((post) => (
        <li key={post.id} className={`post${post.locked ? ' is-locked' : ''}`}>
          {post.locked ? (
            <div className="post-locked">
              <Lock size={28} strokeWidth={1.8} />
              <strong>For Fans</strong>
              <span>Subscribe to unlock</span>
            </div>
          ) : post.mediaUrl ? (
            <img src={post.mediaUrl} alt="" className="post-media" loading="lazy" />
          ) : (
            <p className="post-quote">{post.text}</p>
          )}

          <div className="post-foot">
            {!post.locked && post.mediaUrl && post.text && <p>{post.text}</p>}
            <span>
              {post.fansOnly && (
                <b>
                  <Star size={12} strokeWidth={2.4} /> Fans
                </b>
              )}
              <time dateTime={post.createdAt}>{dateFormat.format(new Date(post.createdAt))}</time>
            </span>
          </div>

          {canDelete && (
            <button type="button" className="post-delete" onClick={() => remove(post)} disabled={removing === post.id} aria-label="Delete post">
              {removing === post.id ? <Loader2 size={16} className="auth-spin" /> : <Trash2 size={16} strokeWidth={2} />}
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
