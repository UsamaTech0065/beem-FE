'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Gamepad2, IdCard, LogIn, MessageCircle, Network, Search, ThumbsUp, Users, X } from 'lucide-react'
import type { CurrentUser } from '@/lib/api-types'
import { AccountMenu } from './account-menu'
import { BrandMark } from './brand-mark'
import { isNavActive, navigationItems } from './data'
import { SignInDialog } from './sign-in-dialog'
import { CoinIcon, EyeFilled } from './icons'

const iconMap = { 'thumbs-up': ThumbsUp, users: Users, search: Search, messages: MessageCircle, games: Gamepad2 }

export function TopNav({ user }: { user: CurrentUser | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [query, setQuery] = useState('')

  // Like Tango, greet a signed-out visitor with the sign-up dialog. Closing it
  // is remembered for the session, so it opens once rather than on every page.
  const AUTH_DISMISSED_KEY = 'beem_auth_dismissed'
  useEffect(() => {
    if (user) return
    let dismissed = false
    try {
      dismissed = sessionStorage.getItem(AUTH_DISMISSED_KEY) === '1'
    } catch {
      // No storage: fall through and show it.
    }
    if (!dismissed) setAuthOpen(true)
  }, [user])

  function closeAuth() {
    setAuthOpen(false)
    try {
      sessionStorage.setItem(AUTH_DISMISSED_KEY, '1')
    } catch {
      // Ignore: dismissal is a convenience.
    }
  }

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setAccountOpen(false)
    // Account pages are private; leave them rather than render a sign-in wall.
    router.push('/')
    router.refresh()
  }

  return (
    <header className="tg-header">
      <div className="tg-header-inner">
        <BrandMark />

        <label className="tg-search">
          <Search size={18} strokeWidth={2.2} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            aria-label="Search"
          />
        </label>

        <nav className="tg-nav" aria-label="Primary navigation">
          {navigationItems.map((item) => {
            const Icon = iconMap[item.icon]
            const isActive = isNavActive(item, pathname)
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`tg-nav-item ${isActive ? 'is-active' : ''}`}
              >
                <Icon size={26} strokeWidth={isActive ? 2.4 : 1.8} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="tg-actions">
          <div className="tg-balance">
            <span>My balance</span>
            <CoinIcon />
            <strong>0</strong>
            <button type="button" aria-label="Add coins" className="tg-balance-add">
              +
            </button>
          </div>

          <Link className="tg-icon-button" href="/leaders/lastday" aria-label="Leaderboard">
            <Network size={26} strokeWidth={1.8} />
          </Link>

          <button className="tg-icon-button" type="button" aria-label="Announcements">
            <IdCard size={26} strokeWidth={1.8} />
          </button>

          {user?.liveStream && (
            <Link
              href={`/stream/${user.liveStream.id}`}
              className="tg-live-pill"
              aria-label={`You are live with ${user.liveStream.viewerCount} watching. Return to your stream.`}
            >
              <span className="tg-live-dot" aria-hidden="true" />
              <span className="tg-live-text">You&apos;re live</span>
              <span className="tg-live-count">
                <EyeFilled size={14} /> {user.liveStream.viewerCount}
              </span>
            </Link>
          )}

          <button
            className={`tg-avatar${accountOpen ? ' is-open' : ''}${user?.liveStream ? ' is-live' : ''}`}
            type="button"
            aria-label={user ? `Account menu for ${user.displayName}` : 'Profile'}
            aria-haspopup={user ? 'menu' : undefined}
            aria-expanded={user ? accountOpen : undefined}
            title={user ? `@${user.handle}` : undefined}
            onClick={user ? () => setAccountOpen((open) => !open) : () => setAuthOpen(true)}
          >
            <img src={user?.avatarUrl ?? '/placeholder-user.jpg'} alt="" />
          </button>

          {user && accountOpen && (
            <AccountMenu user={user} onClose={() => setAccountOpen(false)} onSignOut={signOut} />
          )}

          {user ? null : (
            <button className="tg-sign-in" type="button" onClick={() => setAuthOpen(true)}>
              <LogIn size={18} strokeWidth={2.4} />
              Sign in
            </button>
          )}
        </div>

        {/* Mobile only. Navigation lives in the bottom bar and the account links in
            the avatar menu, so the one thing left to reveal here is search. */}
        <button
          className="tg-menu-toggle"
          type="button"
          aria-label={searchOpen ? 'Close search' : 'Search'}
          aria-expanded={searchOpen}
          onClick={() => setSearchOpen((open) => !open)}
        >
          {searchOpen ? <X /> : <Search />}
        </button>
      </div>

      {searchOpen && (
        <div className="mobile-search">
          <label className="search-box">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              aria-label="Search"
              autoFocus
            />
          </label>
        </div>
      )}

      {authOpen && <SignInDialog onClose={closeAuth} />}
    </header>
  )
}
