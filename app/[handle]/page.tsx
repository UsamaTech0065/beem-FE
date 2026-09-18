import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ActionRail } from '@/components/beem/action-rail'
import { MobileBottomNav } from '@/components/beem/mobile-bottom-nav'
import { ProfileView } from '@/components/beem/profile-view'
import { TopNav } from '@/components/beem/top-nav'
import { getCurrentUser, getProfile, getProfilePosts } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ handle: string }> }

/** Handles are lowercase letters, digits and underscores. Anything else cannot be a profile. */
const HANDLE = /^[a-z0-9_]{2,32}$/

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const profile = HANDLE.test(handle.toLowerCase()) ? await getProfile(handle, null) : null
  return { title: profile ? `${profile.displayName} (@${profile.handle}) on beem` : 'beem' }
}

/**
 * A person's public page, at the root like the reference: /ruby.
 *
 * Next matches the app's own pages (/chats, /vault, ...) before this dynamic
 * segment, and the API refuses handles that would collide with them, so the
 * two namespaces cannot shadow each other.
 */
export default async function ProfileRoute({ params }: Props) {
  const { handle } = await params
  if (!HANDLE.test(handle.toLowerCase())) notFound()

  const accessToken = await getAccessToken()
  const [profile, posts, user] = await Promise.all([
    getProfile(handle, accessToken),
    getProfilePosts(handle, accessToken),
    getCurrentUser(accessToken),
  ])
  if (!profile) notFound()

  return (
    <div className="beem-app">
      <TopNav user={user} />
      <ProfileView profile={profile} posts={posts} signedIn={Boolean(user)} />
      <ActionRail />
      <MobileBottomNav />
    </div>
  )
}
