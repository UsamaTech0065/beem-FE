import type { Metadata } from 'next'
import Link from 'next/link'
import { ActionRail } from '@/components/beem/action-rail'
import { StreamGrid } from '@/components/beem/following-section'
import { MobileBottomNav } from '@/components/beem/mobile-bottom-nav'
import { TopNav } from '@/components/beem/top-nav'
import { UserAvatar } from '@/components/beem/user-avatar'
import { compactNumber } from '@/components/beem/account-nav'
import { getCurrentUser, search } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<{ q?: string | string[] }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  return { title: typeof q === 'string' && q ? `"${q}" · beem search` : 'Search · beem' }
}

/** Full results for the header search: people first, then live streams. */
export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = (typeof q === 'string' ? q : '').trim()
  const [user, results] = await Promise.all([getCurrentUser(await getAccessToken()), query ? search(query) : null])

  return (
    <div className="beem-app">
      <TopNav user={user} initialQuery={query} />
      <main className="tg-main results">
        {!query ? (
          <p className="feed-empty">Type a name or a handle in the search box.</p>
        ) : !results ? (
          <p className="feed-empty">Search is not available right now. Try again in a moment.</p>
        ) : results.people.length === 0 && results.streams.length === 0 ? (
          <p className="feed-empty">Nothing found for &ldquo;{query}&rdquo;.</p>
        ) : (
          <>
            <h1 className="results-title">Results for &ldquo;{query}&rdquo;</h1>

            {results.people.length > 0 && (
              <section className="content-section" aria-labelledby="people-heading">
                <div className="section-heading">
                  <h2 id="people-heading">People</h2>
                </div>
                <ul className="results-people">
                  {results.people.map((person) => (
                    <li key={person.id}>
                      <Link href={`/${person.handle}`} className="results-person">
                        <span className={`people-ring${person.liveStreamId ? ' is-live' : ''}`}>
                          <UserAvatar src={person.avatarUrl} name={person.displayName} size={56} />
                          {person.liveStreamId && <b>LIVE</b>}
                        </span>
                        <span className="results-person-copy">
                          <strong>{person.displayName}</strong>
                          <span>
                            @{person.handle} &middot; {compactNumber(person.followerCount)} followers
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {results.streams.length > 0 && (
              <section className="content-section" aria-labelledby="streams-heading">
                <div className="section-heading">
                  <h2 id="streams-heading">Live now</h2>
                </div>
                <StreamGrid streams={results.streams} />
              </section>
            )}
          </>
        )}
      </main>
      <ActionRail />
      <MobileBottomNav />
    </div>
  )
}
