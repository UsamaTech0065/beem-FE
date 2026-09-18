import Link from 'next/link'
import { Gem } from 'lucide-react'
import { EyeFilled } from './icons'

const FALLBACK_AVATAR = '/placeholder-user.jpg'

/**
 * One ranked row. Creators are ranked on diamonds earned, families on views —
 * the metric changes the icon, so it is passed in rather than assumed.
 */
export function LeaderRow({
  rank,
  name,
  avatarUrl,
  score,
  metric,
  href,
}: {
  rank: number
  name: string
  avatarUrl: string | null
  score: number
  metric: 'diamonds' | 'views'
  href?: string
}) {
  const identity = (
    <>
      <img className="leader-avatar" src={avatarUrl ?? FALLBACK_AVATAR} alt="" />
      <span className="leader-name">{name}</span>
    </>
  )

  return (
    <li className="leader-row">
      <span className="leader-rank">{rank}</span>

      {href ? (
        <Link href={href} className="leader-identity">
          {identity}
        </Link>
      ) : (
        <span className="leader-identity">{identity}</span>
      )}

      <span className="leader-score">
        {metric === 'views' ? (
          <EyeFilled size={16} />
        ) : (
          <Gem size={15} strokeWidth={2.2} />
        )}
        {/* Full precision with separators: a leaderboard is a ranking, and
            abbreviating to "1.1M" would make adjacent places look identical. */}
        {score.toLocaleString('en-US')}
      </span>
    </li>
  )
}
