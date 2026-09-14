import Link from 'next/link'
import { ChevronDown, MapPin } from 'lucide-react'
import type { Category } from '@/lib/api-types'

/**
 * The category strip under the header. Tabs are links, so a filtered view is
 * shareable and opens in a new tab. The region picker on the right is
 * decorative until there is a location API behind it.
 */
export function LiveTabs({ categories, active }: { categories: Category[]; active: string }) {
  return (
    <div className="tg-tabs-row">
      <nav className="tg-tabs" aria-label="Live categories">
        {categories.map((category) => {
          const isActive = category.slug === active
          return (
            <Link
              key={category.slug}
              href={`/live/${category.slug}`}
              aria-current={isActive ? 'page' : undefined}
              className={`tg-tab ${isActive ? 'is-active' : ''}`}
            >
              {category.slug === 'nearby' && <MapPin size={20} fill="currentColor" strokeWidth={1.4} />}
              {category.name}
            </Link>
          )
        })}
      </nav>

      <button type="button" className="tg-region" aria-label="Choose regions">
        {/* Drawn in CSS: emoji flags render as letter pairs on Windows. */}
        <span className="tg-flags" aria-hidden="true">
          <span className="tg-flag tg-flag-uk" />
          <span className="tg-flag tg-flag-in" />
          <span className="tg-flag tg-flag-more">+9</span>
        </span>
        <ChevronDown size={18} strokeWidth={2.2} />
      </button>
    </div>
  )
}
