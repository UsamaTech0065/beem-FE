import type { Metadata } from 'next'
import { ActionRail } from '@/components/beem/action-rail'
import { StreamGrid } from '@/components/beem/following-section'
import { MobileBottomNav } from '@/components/beem/mobile-bottom-nav'
import { PersonCard } from '@/components/beem/person-card'
import { TopNav } from '@/components/beem/top-nav'
import { getCurrentUser, search } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<{ q?: string | string[] }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  return { title: typeof q === 'string' && q ? `"${q}" · beem search` : 'Search · beem' }
}

/** Full results for the header search: a grid of people, then live streams. */
export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = (typeof q === 'string' ? q : '').trim()
  const accessToken = await getAccessToken()
  const [user, results] = await Promise.all([getCurrentUser(accessToken), query ? search(query, accessToken) : null])

  return (
    <div className="beem-app">
      <TopNav user={user} initialQuery={query} />
      <main className="tg-main results">
        {query && <h1 className="results-title">Search results for {query}</h1>}

        {!query ? (
          <p className="feed-empty">Type a name or a handle in the search box.</p>
        ) : !results ? (
          <p className="feed-empty">Search is not available right now. Try again in a moment.</p>
        ) : results.people.length === 0 && results.streams.length === 0 ? (
          <p className="feed-empty">Nothing found for &ldquo;{query}&rdquo;.</p>
        ) : (
          <>
            {results.people.length > 0 && (
              <ul className="results-grid" aria-label="People">
                {results.people.map((person) => (
                  <PersonCard key={person.id} person={person} signedIn={Boolean(user)} />
                ))}
              </ul>
            )}

            {results.streams.length > 0 && (
              <section className="content-section results-live" aria-labelledby="streams-heading">
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
