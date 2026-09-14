import Link from 'next/link'
import { ChevronDown, Globe } from 'lucide-react'

export const PERIODS = [
  { slug: 'lastday', label: 'Daily' },
  { slug: 'lastweek', label: 'Weekly' },
  { slug: 'alltime', label: 'All time' },
] as const

export type PeriodSlug = (typeof PERIODS)[number]['slug']
export type BoardSlug = 'creators' | 'family'

export function isPeriod(value: string): value is PeriodSlug {
  return PERIODS.some((period) => period.slug === value)
}

/** Creators live at /leaders/<period>; families add a segment: /leaders/family/<period>. */
export function boardHref(board: BoardSlug, period: PeriodSlug): string {
  return board === 'family' ? `/leaders/family/${period}` : `/leaders/${period}`
}

export function LeaderControls({ board, period }: { board: BoardSlug; period: PeriodSlug }) {
  return (
    <div className="leader-controls">
      <nav className="leader-boards" aria-label="Leaderboard type">
        {(['creators', 'family'] as const).map((slug) => (
          <Link
            key={slug}
            href={boardHref(slug, period)}
            aria-current={board === slug ? 'page' : undefined}
            className={`leader-board ${board === slug ? 'is-active' : ''}`}
          >
            {slug === 'family' ? 'Family' : 'Creators'}
          </Link>
        ))}
      </nav>

      <div className="leader-right">
        <nav className="leader-periods" aria-label="Time range">
          {PERIODS.map((entry) => (
            <Link
              key={entry.slug}
              href={boardHref(board, entry.slug)}
              aria-current={period === entry.slug ? 'page' : undefined}
              className={`leader-period ${period === entry.slug ? 'is-active' : ''}`}
            >
              {entry.label}
            </Link>
          ))}
        </nav>

        {/* Creators only. Families are global in the reference and carry no
            region filter beside the period segment. */}
        {board === 'creators' && (
          <button type="button" className="leader-region" aria-label="Choose region">
            <Globe size={22} strokeWidth={1.9} />
            <ChevronDown size={18} strokeWidth={2.2} />
          </button>
        )}
      </div>
    </div>
  )
}
