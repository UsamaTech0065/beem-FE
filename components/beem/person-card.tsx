'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Check, Gem, Users } from 'lucide-react'
import type { SearchPerson } from '@/lib/api-types'
import { compactNumber } from './account-nav'
import { SignInDialog } from './sign-in-dialog'
import { UserAvatar } from './user-avatar'

type Props = {
  person: SearchPerson
  /** Whether anyone is signed in; Follow opens the sign-in dialog otherwise. */
  signedIn: boolean
}

/** A person on the search results grid: photo, name, earned and followers, Follow. */
export function PersonCard({ person, signedIn }: Props) {
  const [following, setFollowing] = useState(Boolean(person.isFollowing))
  const [followers, setFollowers] = useState(person.followerCount)
  const [busy, setBusy] = useState(false)
  const [signInOpen, setSignInOpen] = useState(false)

  async function toggleFollow() {
    if (!signedIn) return setSignInOpen(true)
    setBusy(true)
    const response = await fetch(`/api/follows/${encodeURIComponent(person.id)}`, {
      method: following ? 'DELETE' : 'POST',
    }).catch(() => null)
    setBusy(false)
    if (!response?.ok) return
    setFollowers((count) => Math.max(0, count + (following ? -1 : 1)))
    setFollowing(!following)
  }

  return (
    <li className="person-card">
      <Link href={person.liveStreamId ? `/stream/${person.liveStreamId}` : `/${person.handle}`} className="person-card-top">
        <span className={`person-card-ring${person.liveStreamId ? ' is-live' : ''}`}>
          <UserAvatar src={person.avatarUrl} name={person.displayName} size={188} />
          {person.liveStreamId && <b>LIVE</b>}
        </span>
        <strong>{person.displayName}</strong>
        <span className="person-card-stats">
          <span>
            <Gem size={12} strokeWidth={2.2} /> {compactNumber(person.diamondsTotal)}
          </span>
          <span>
            <Users size={12} strokeWidth={2.2} /> {compactNumber(followers)}
          </span>
        </span>
      </Link>

      {/* Your own row has nothing to follow. */}
      {person.isFollowing !== null || !signedIn ? (
        <button
          type="button"
          className={`person-card-follow${following ? ' is-on' : ''}`}
          onClick={toggleFollow}
          disabled={busy}
          aria-pressed={following}
        >
          {following ? (
            <>
              <Check size={16} strokeWidth={2.6} /> Following
            </>
          ) : (
            'Follow'
          )}
        </button>
      ) : (
        <Link href={`/${person.handle}`} className="person-card-follow is-on">
          You
        </Link>
      )}

      {signInOpen && <SignInDialog onClose={() => setSignInOpen(false)} />}
    </li>
  )
}
