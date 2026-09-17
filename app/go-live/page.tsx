import { AccountShell } from '@/components/beem/account-shell'
import { GoLiveForm } from '@/components/beem/go-live-form'
import { LiveNowCard } from '@/components/beem/live-now-card'
import { getCategories, getCurrentUser } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

/** Nearby, New and Popular are feeds over every stream, not genres a stream belongs to. */
const FEED_SLUGS = new Set(['nearby', 'new', 'popular'])

export default async function GoLivePage() {
  const [user, categories] = await Promise.all([getCurrentUser(await getAccessToken()), getCategories()])

  return (
    <AccountShell
      user={user}
      eyebrow="Creator Tools"
      title="Go live"
      subtitle="Check your camera, name your stream, and start."
    >
      {user?.liveStream ? (
        <LiveNowCard stream={user.liveStream} />
      ) : user ? (
        <GoLiveForm
          defaultTitle={`${user.displayName} is live`}
          categories={categories.filter((category) => !FEED_SLUGS.has(category.slug))}
        />
      ) : null}
    </AccountShell>
  )
}
