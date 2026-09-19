'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import {
  Camera,
  Check,
  Forward,
  Gem,
  Gift,
  LayoutList,
  Library,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  SquarePlay,
  SquarePlus,
  Star,
  Video,
} from 'lucide-react'
import type { DmConversation, ProfilePage, ProfilePost } from '@/lib/api-types'
import { compactNumber } from './account-nav'
import { EyeFilled } from './icons'
import { ProfilePosts } from './profile-posts'
import { SignInDialog } from './sign-in-dialog'
import { UserAvatar } from './user-avatar'

const TABS = [
  { id: 'all', label: 'All', icon: LayoutList },
  { id: 'fans', label: 'For Fans', icon: Star },
  { id: 'moments', label: 'Moments', icon: SquarePlay },
  { id: 'cards', label: 'beem Cards', icon: Library },
  { id: 'collections', label: 'Collections', icon: Gift },
] as const
type TabId = (typeof TABS)[number]['id']

const EMPTY_LABEL: Record<TabId, string> = {
  all: 'No Posts',
  fans: 'No Posts for Fans',
  moments: 'No Moments',
  cards: 'No Cards',
  collections: 'No Collections',
}

/** Deterministic on server and client alike: fixed locale, fixed zone. */
const joinedFormat = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' })

type Props = {
  profile: ProfilePage
  posts: ProfilePost[]
  /** Whether anyone is signed in; actions that need an account open the sign-in dialog otherwise. */
  signedIn: boolean
}

export function ProfileView({ profile, posts, signedIn }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<TabId>('all')
  const [following, setFollowing] = useState(Boolean(profile.isFollowing))
  const [followers, setFollowers] = useState(profile.followerCount)
  const [busy, setBusy] = useState<'follow' | 'message' | null>(null)
  const [signInOpen, setSignInOpen] = useState(false)
  const [shared, setShared] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(timer)
  }, [toast])

  async function toggleFollow() {
    if (!signedIn) return setSignInOpen(true)
    setBusy('follow')
    const response = await fetch(`/api/follows/${encodeURIComponent(profile.id)}`, {
      method: following ? 'DELETE' : 'POST',
    }).catch(() => null)
    setBusy(null)
    if (!response?.ok) return setToast('Could not update follow. Try again.')

    setFollowers((count) => Math.max(0, count + (following ? -1 : 1)))
    setFollowing(!following)
  }

  /** Message and Send gift both land in the conversation, where the gift strip lives. */
  async function openChat() {
    if (!signedIn) return setSignInOpen(true)
    setBusy('message')
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

  async function share() {
    const url = `${location.origin}/${profile.handle}`
    try {
      if (navigator.share) await navigator.share({ title: `${profile.displayName} on beem`, url })
      else await navigator.clipboard.writeText(url)
      setShared(true)
      setTimeout(() => setShared(false), 1800)
    } catch {
      // Share sheet dismissed.
    }
  }

  const avatar = <UserAvatar src={profile.avatarUrl} name={profile.displayName} size={144} className="profile-avatar" />
  const shown = tab === 'all' ? posts : tab === 'fans' ? posts.filter((post) => post.fansOnly) : []
  const meta = [`@${profile.handle}`, profile.age !== null ? String(profile.age) : null, `Joined ${joinedFormat.format(new Date(profile.createdAt))}`]

  return (
    <main className="tg-main profile">
      <header className="profile-head">
        <div className="profile-avatar-slot">
          {profile.liveStream ? (
            <Link href={`/stream/${profile.liveStream.id}`} className="profile-avatar-wrap is-live" aria-label={`${profile.displayName} is live. Watch now.`}>
              {avatar}
              <span className="profile-live-tag">LIVE</span>
            </Link>
          ) : (
            <span className="profile-avatar-wrap">{avatar}</span>
          )}
          {profile.isSelf && (
            <Link href="/edit-profile" className="profile-camera" aria-label="Change profile photo">
              <Camera size={20} strokeWidth={2.2} />
            </Link>
          )}
        </div>

        <div className="profile-info">
          <div className="profile-title">
            <h1>{profile.displayName}</h1>
            <div className="profile-icons">
              <button type="button" onClick={share} aria-label="Share profile">
                {shared ? <Check size={24} /> : <Forward size={24} strokeWidth={1.8} />}
              </button>
              {profile.isSelf ? (
                <Link href="/edit-profile" aria-label="Edit profile">
                  <Pencil size={22} strokeWidth={1.8} />
                </Link>
              ) : (
                <button type="button" aria-label="More options" disabled title="Coming soon">
                  <MoreHorizontal size={24} />
                </button>
              )}
            </div>
          </div>

          <p className="profile-meta">{meta.filter(Boolean).join(' · ')}</p>

          {profile.bio && <p className="profile-bio">{profile.bio}</p>}

          <div className="profile-stats">
            <Stat
              value={compactNumber(profile.diamondsTotal)}
              label={
                <>
                  <Gem size={13} strokeWidth={2.2} /> Earned
                </>
              }
            />
            {/* Followers / Following open their lists, but only on your own
                profile — the list endpoints are for the signed-in user. */}
            <Stat
              value={compactNumber(followers)}
              label="Followers"
              href={profile.isSelf ? '/my-followers' : undefined}
            />
            <Stat
              value={compactNumber(profile.followingCount)}
              label="Following"
              href={profile.isSelf ? '/my-following' : undefined}
            />
          </div>

          <div className="profile-actions">
            {profile.isSelf ? (
              <>
                <Link href="/create-post" className="profile-btn profile-btn--primary">
                  <SquarePlus size={22} strokeWidth={2} /> Create Post
                </Link>
                <Link href={profile.liveStream ? `/stream/${profile.liveStream.id}` : '/go-live'} className="profile-btn">
                  <Video size={22} strokeWidth={1.9} /> {profile.liveStream ? 'Back to Live' : 'Start Live'}
                </Link>
                <Link href="/vip" className="profile-btn profile-btn--round" aria-label="VIP Club">
                  <Gem size={22} strokeWidth={1.9} />
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={`profile-btn ${following ? 'is-following' : 'profile-btn--primary'}`}
                  onClick={toggleFollow}
                  disabled={busy === 'follow'}
                  aria-pressed={following}
                >
                  {following ? <Check size={20} strokeWidth={2.4} /> : <Plus size={20} strokeWidth={2.6} />}
                  {following ? 'Following' : 'Follow'}
                </button>
                <button type="button" className="profile-btn" onClick={openChat} disabled={busy === 'message'}>
                  {busy === 'message' ? <Loader2 size={20} className="auth-spin" /> : <MessageCircle size={20} strokeWidth={1.9} />}
                  Message
                </button>
                <button type="button" className="profile-btn" onClick={openChat} disabled={busy === 'message'}>
                  <Gift size={20} strokeWidth={1.9} /> Send gift
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <nav className="profile-tabs" role="tablist" aria-label="Profile sections">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`profile-tab${tab === id ? ' is-active' : ''}`}
            onClick={() => setTab(id)}
          >
            <Icon size={24} strokeWidth={tab === id ? 2.2 : 1.6} />
            {label}
          </button>
        ))}
      </nav>

      <section className="profile-body" role="tabpanel">
        {tab === 'all' && profile.liveStream && (
          <Link href={`/stream/${profile.liveStream.id}`} className="profile-livecard">
            <span className="profile-livecard-tag">
              <span className="tg-live-dot" aria-hidden="true" /> LIVE NOW
            </span>
            <strong>{profile.liveStream.title}</strong>
            <span className="profile-livecard-meta">
              <EyeFilled size={15} /> {profile.liveStream.viewerCount} watching
            </span>
            <span className="profile-btn profile-btn--primary">Watch</span>
          </Link>
        )}

        {shown.length > 0 ? (
          <ProfilePosts handle={profile.handle} posts={shown} canDelete={profile.isSelf} onError={setToast} />
        ) : (
          !(tab === 'all' && profile.liveStream) && (
            <div className="profile-none">
              <NoPostsArt />
              <p>{EMPTY_LABEL[tab]}</p>
            </div>
          )
        )}
      </section>

      {toast && (
        <div className="profile-toast" role="status">
          {toast}
        </div>
      )}

      {signInOpen && <SignInDialog onClose={() => setSignInOpen(false)} />}
    </main>
  )
}

/** The tilted photo card with sparkles shown under an empty tab. */
/** One profile stat. A link when `href` is given (own profile), else static. */
function Stat({ value, label, href }: { value: string; label: ReactNode; href?: string }) {
  const inner = (
    <>
      <span className="profile-stat-num">{value}</span>
      <span className="profile-stat-label">{label}</span>
    </>
  )
  return href ? (
    <Link href={href} className="profile-stat profile-stat--link">
      {inner}
    </Link>
  ) : (
    <div className="profile-stat">{inner}</div>
  )
}

function NoPostsArt() {
  return (
    <svg width="96" height="84" viewBox="0 0 96 84" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="14" y="10" width="56" height="66" rx="8" transform="rotate(-6 42 43)" />
      <path d="M72 18c4 12 5 34 1 52" />
      <circle cx="34" cy="30" r="3.5" transform="rotate(-6 42 43)" />
      <path d="M28 46l8-9 7 8 5-5 8 9" transform="rotate(-6 42 43)" />
      <path d="M40 62c2-3 6-1 4 2l-3 3-4-3c-2-2 1-5 3-2z" transform="rotate(-6 42 43)" />
      <rect x="52" y="60" width="8" height="6" rx="2" transform="rotate(-6 42 43)" />
      <path d="M82 4v8M78 8h8" />
      <circle cx="90" cy="58" r="2.5" />
      <circle cx="4" cy="44" r="1" fill="currentColor" />
    </svg>
  )
}
