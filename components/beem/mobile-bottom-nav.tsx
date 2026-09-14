'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Gamepad2, MessageCircle, Search, ThumbsUp, Users } from 'lucide-react'
import { isNavActive, navigationItems } from './data'

const iconMap = { 'thumbs-up': ThumbsUp, users: Users, search: Search, messages: MessageCircle, games: Gamepad2 }

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile primary navigation">
      {navigationItems.map((item) => {
        const Icon = iconMap[item.icon]
        const isActive = isNavActive(item, pathname)
        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`mobile-bottom-item ${isActive ? 'active' : ''}`}
          >
            <span className="mobile-bottom-icon">
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            </span>
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
