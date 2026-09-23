'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Gamepad2, MessageCircle, Search, ThumbsUp, Users } from 'lucide-react'
import { isNavActive, navigationItems } from './data'
import { useUnreadChats } from '@/lib/unread-chats'

const iconMap = { 'thumbs-up': ThumbsUp, users: Users, search: Search, messages: MessageCircle, games: Gamepad2 }

/**
 * `signedIn` is unknown to most pages, so the badge asks the API itself; a
 * signed-out visitor gets a 401 and no badge.
 */
export function MobileBottomNav() {
  const pathname = usePathname()
  const unreadChats = useUnreadChats(true)

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
              {item.icon === 'messages' && unreadChats > 0 && (
                <b className="nav-count" aria-label={`${unreadChats} unread`}>
                  {unreadChats > 99 ? '99+' : unreadChats}
                </b>
              )}
            </span>
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
