'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { Gamepad2, LogIn, Megaphone, Menu, MessageCircle, Search, ThumbsUp, Trophy, Users, X } from 'lucide-react'
import type { CurrentUser } from '@/lib/api-types'
import { AccountMenu } from './account-menu'
import { accountSections } from './account-nav'
import { BrandMark } from './brand-mark'
import { isNavActive, navigationItems } from './data'
import { SignInDialog } from './sign-in-dialog'

const iconMap = { 'thumbs-up': ThumbsUp, users: Users, search: Search, messages: MessageCircle, games: Gamepad2 }

export function TopNav({ user }: { user: CurrentUser | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [query, setQuery] = useState('')

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setMenuOpen(false)
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
            <span className="tg-coin" aria-hidden="true" />
            <strong>0</strong>
            <button type="button" aria-label="Add coins" className="tg-balance-add">
              +
            </button>
          </div>

          <Link className="tg-icon-button" href="/leaders/lastday" aria-label="Leaderboard">
            <Trophy size={26} strokeWidth={1.8} />
          </Link>

          <button className="tg-icon-button" type="button" aria-label="Announcements">
            <Megaphone size={26} strokeWidth={1.8} />
          </button>

          <button
            className={`tg-avatar${accountOpen ? ' is-open' : ''}`}
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
              <LogIn size={22} strokeWidth={2.4} />
              Sign in
            </button>
          )}
        </div>

        <button
          className="tg-menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          <div className="search-box">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              aria-label="Search"
            />
          </div>
          {navigationItems.map((item) => (
            <Link key={item.label} href={item.href} onClick={() => setMenuOpen(false)} className="mobile-nav-item">
              {item.label}
            </Link>
          ))}
          {user ? (
            <>
              {accountSections.map((section) => (
                <div key={section.title} className="mobile-menu-group">
                  <span className="mobile-menu-title">{section.title}</span>
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="mobile-nav-item"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}
              <button type="button" className="sign-in-button" onClick={signOut}>
                Sign out of @{user.handle}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="sign-in-button"
              onClick={() => {
                setMenuOpen(false)
                setAuthOpen(true)
              }}
            >
              Sign in
            </button>
          )}
        </div>
      )}

      {authOpen && <SignInDialog onClose={() => setAuthOpen(false)} />}
    </header>
  )
}
