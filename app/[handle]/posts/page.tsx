import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ActionRail } from '@/components/beem/action-rail'
import { MobileBottomNav } from '@/components/beem/mobile-bottom-nav'
import { PostFeed } from '@/components/beem/post-feed'
import { TopNav } from '@/components/beem/top-nav'
import { getCurrentUser, getProfile, getProfilePosts } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ handle: string }>
  searchParams: Promise<{ p?: string | string[] }>
}

const HANDLE = /^[a-z0-9_]{2,32}$/

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  return { title: `Posts by @${handle.toLowerCase()} · beem` }
}

/** Someone's posts at full size. ?p=<id> opens the feed at that post. */
export default async function PostsRoute({ params, searchParams }: Props) {
  const [{ handle }, { p }] = await Promise.all([params, searchParams])
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
      <PostFeed profile={profile} posts={posts} focusId={typeof p === 'string' ? p : null} signedIn={Boolean(user)} />
      <ActionRail />
      <MobileBottomNav />
    </div>
  )
}
