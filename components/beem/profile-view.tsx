'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Check,
  Clapperboard,
  Gavel,
  Gem,
  Gift,
  LayoutList,
  Loader2,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Radio,
  Share2,
  Star,
} from 'lucide-react'
import type { DmConversation, ProfilePage } from '@/lib/api-types'
import { compactNumber } from './account-nav'
import { EyeFilled } from './icons'
import { ProfileEditDialog } from './profile-edit-dialog'
import { SignInDialog } from './sign-in-dialog'
import { UserAvatar } from './user-avatar'

const TABS = [
  { id: 'all', label: 'All', icon: LayoutList },
  { id: 'fans', label: 'For Fans', icon: Star },
  { id: 'moments', label: 'Moments', icon: Clapperboard },
  { id: 'cards', label: 'beem Cards', icon: Gavel },
] as const
type TabId = (typeof TABS)[number]['id']

/** Deterministic on server and client alike: fixed locale, fixed zone. */
const joinedFormat = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' })

const ROLE_LABEL: Record<ProfilePage['role'], string> = {
  VIEWER: 'Member',
  CREATOR: 'Creator',
  MODERATOR: 'Moderator',
  ADMIN: 'beem team',
}

type Props = {
  profile: ProfilePage
  /** Whether anyone is signed in; actions that need an account open the sign-in dialog otherwise. */
  signedIn: boolean
}

export function ProfileView({ profile, signedIn }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<TabId>('all')
  const [following, setFollowing] = useState(Boolean(profile.isFollowing))
  const [followers, setFollowers] = useState(profile.followerCount)
  const [busy, setBusy] = useState<'follow' | 'message' | null>(null)
  const [signInOpen, setSignInOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
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

  return (
    <main className="tg-main profile">
      <header className="profile-head">
        {profile.liveStream ? (
          <Link href={`/stream/${profile.liveStream.id}`} className="profile-avatar-wrap is-live" aria-label={`${profile.displayName} is live. Watch now.`}>
            {avatar}
            <span className="profile-live-tag">LIVE</span>
          </Link>
        ) : (
          <span className="profile-avatar-wrap">{avatar}</span>
        )}

        <div className="profile-info">
          <div className="profile-title">
            <h1>{profile.displayName}</h1>
            <div className="profile-icons">
              <button type="button" onClick={share} aria-label="Share profile">
                {shared ? <Check size={22} /> : <Share2 size={22} strokeWidth={1.8} />}
              </button>
              <button type="button" aria-label="More options" disabled title="Coming soon">
                <MoreHorizontal size={22} />
              </button>
            </div>
          </div>

          <p className="profile-meta">
            @{profile.handle} <span aria-hidden="true">·</span> {ROLE_LABEL[profile.role]}{' '}
            <span aria-hidden="true">·</span> Joined {joinedFormat.format(new Date(profile.createdAt))}
          </p>

          {profile.bio && <p className="profile-bio">{profile.bio}</p>}

          <dl className="profile-stats">
            <div>
              <dt>{compactNumber(profile.diamondsTotal)}</dt>
              <dd>
                <Gem size={13} strokeWidth={2.2} /> Earned
              </dd>
            </div>
            <div>
              <dt>{compactNumber(followers)}</dt>
              <dd>Followers</dd>
            </div>
            <div>
              <dt>{compactNumber(profile.followingCount)}</dt>
              <dd>Following</dd>
            </div>
          </dl>

          <div className="profile-actions">
            {profile.isSelf ? (
              <>
                <button type="button" className="profile-btn profile-btn--primary" onClick={() => setEditOpen(true)}>
                  <Pencil size={18} strokeWidth={2.2} /> Edit profile
                </button>
                <Link href="/go-live" className="profile-btn">
                  <Radio size={20} strokeWidth={1.9} /> Go live
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
            <Icon size={22} strokeWidth={tab === id ? 2.3 : 1.7} />
            {label}
          </button>
        ))}
      </nav>

      <section className="profile-body" role="tabpanel">
        {tab === 'all' &&
          (profile.liveStream ? (
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
          ) : (
            <Empty icon={LayoutList} title="No posts yet">
              {profile.isSelf ? 'Go live and your streams and posts will show up here.' : `${profile.displayName} has not posted anything yet.`}
            </Empty>
          ))}

        {tab === 'fans' && (
          <Empty icon={Lock} title="Nothing for fans yet">
            Exclusive posts for paying fans appear here once content packs launch.
          </Empty>
        )}

        {tab === 'moments' && (
          <Empty icon={Clapperboard} title="No moments yet">
            Short clips from live streams will be saved here.
          </Empty>
        )}

        {tab === 'cards' && (
          <Empty icon={Gavel} title="No cards on auction">
            Collectible cards appear here while they are up for bidding.{' '}
            <Link href="/auction">How the auction works</Link>
          </Empty>
        )}
      </section>

      {toast && (
        <div className="profile-toast" role="status">
          {toast}
        </div>
      )}

      {signInOpen && <SignInDialog onClose={() => setSignInOpen(false)} />}
      {editOpen && <ProfileEditDialog profile={profile} onClose={() => setEditOpen(false)} />}
    </main>
  )
}

function Empty({ icon: Icon, title, children }: { icon: typeof Lock; title: string; children: React.ReactNode }) {
  return (
    <div className="acct-empty profile-empty">
      <span className="acct-empty-icon">
        <Icon size={30} strokeWidth={1.8} />
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  )
}
