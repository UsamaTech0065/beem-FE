import Link from 'next/link'
import type { FeedPost, NewMember } from '@/lib/api-types'
import { UserAvatar } from './user-avatar'

/** Deterministic on server and client alike: fixed locale, fixed zone. */
const dateFormat = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', timeZone: 'UTC' })

/**
 * The top of For You: the newest members and the newest posts. Both come from
 * real accounts, newest first, so a person who just joined or just posted is
 * the first thing a visitor sees. Each row renders nothing when it is empty.
 */
export function HomeHighlights({ members, posts }: { members: NewMember[]; posts: FeedPost[] }) {
  return (
    <>
      {members.length > 0 && (
        <section className="content-section" aria-labelledby="members-heading">
          <div className="section-heading">
            <h2 id="members-heading">New on beem</h2>
          </div>
          <ul className="people-rail">
            {members.map((member) => (
              <li key={member.id}>
                <Link href={member.liveStreamId ? `/stream/${member.liveStreamId}` : `/${member.handle}`} className="people-card">
                  <span className={`people-ring${member.liveStreamId ? ' is-live' : ''}`}>
                    <UserAvatar src={member.avatarUrl} name={member.displayName} size={72} />
                    {member.liveStreamId && <b>LIVE</b>}
                  </span>
                  <strong>{member.displayName}</strong>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {posts.length > 0 && (
        <section className="content-section" aria-labelledby="posts-heading">
          <div className="section-heading">
            <h2 id="posts-heading">Latest posts</h2>
          </div>
          <ul className="postrail">
            {posts.map((post) => (
              <li key={post.id}>
                <Link href={`/${post.author.handle}/posts?p=${encodeURIComponent(post.id)}`} className="postrail-card">
                  {post.mediaUrl ? (
                    <img src={post.mediaUrl} alt="" loading="lazy" className="postrail-media" />
                  ) : (
                    <p className="postrail-quote">{post.text}</p>
                  )}
                  <span className="postrail-foot">
                    <UserAvatar src={post.author.avatarUrl} name={post.author.displayName} size={28} />
                    <span>
                      <strong>{post.author.displayName}</strong>
                      <small>
                        {post.mediaUrl && post.text ? `${post.text} · ` : ''}
                        {dateFormat.format(new Date(post.createdAt))}
                      </small>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
