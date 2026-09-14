'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import {
  ChartColumn,
  ChevronRight,
  Crown,
  Diamond,
  Gamepad2,
  Gavel,
  Gem,
  GraduationCap,
  Handshake,
  LifeBuoy,
  Lock,
  LogOut,
  QrCode,
  Star,
  Users,
} from 'lucide-react'
import type { CurrentUser } from '@/lib/api-types'
import { accountSections, compactNumber, type AccountIcon } from './account-nav'

const ICONS: Record<AccountIcon, typeof Lock> = {
  vault: Lock,
  stats: ChartColumn,
  fans: Users,
  agency: Handshake,
  vip: Crown,
  store: Gem,
  help: GraduationCap,
  auction: Gavel,
  games: Gamepad2,
  support: LifeBuoy,
  app: QrCode,
}

type Props = {
  user: CurrentUser
  onClose: () => void
  onSignOut: () => void
}

/** Dropdown under the avatar. Closes on outside click and Escape. */
export function AccountMenu({ user, onClose, onSignOut }: Props) {
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node
      // The avatar button toggles the menu itself; ignore clicks on it here.
      if (panel.current && !panel.current.contains(target) && !(target as Element).closest?.('.tg-avatar')) {
        onClose()
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div className="acct-menu" ref={panel} role="menu" aria-label="Account">
      <Link href="/statistics" className="acct-profile" onClick={onClose} role="menuitem">
        <img src={user.avatarUrl ?? '/placeholder-user.jpg'} alt="" className="acct-profile-avatar" />
        <div className="acct-profile-body">
          <strong>{user.displayName}</strong>
          <div className="acct-profile-stats">
            <span title="Diamonds earned">
              <Diamond size={14} strokeWidth={2.2} />
              {compactNumber(user.diamondsTotal)}
            </span>
            <span title="Followers">
              <Users size={14} strokeWidth={2.2} />
              {compactNumber(user.followerCount)}
            </span>
            <span title="Following">
              <Star size={14} strokeWidth={2.2} />
              {compactNumber(user.followingCount)}
            </span>
          </div>
        </div>
        <ChevronRight size={20} strokeWidth={1.8} className="acct-profile-chevron" />
      </Link>

      {accountSections.map((section) => (
        <div className="acct-section" key={section.title}>
          <h4>{section.title}</h4>
          {section.items.map((item) => {
            const Icon = ICONS[item.icon]
            return (
              <Link key={item.href} href={item.href} className="acct-item" onClick={onClose} role="menuitem">
                <Icon size={22} strokeWidth={1.8} />
                <span className="acct-item-text">
                  {item.label}
                  {item.description && <small>{item.description}</small>}
                </span>
              </Link>
            )
          })}
        </div>
      ))}

      <div className="acct-section">
        <button type="button" className="acct-item" onClick={onSignOut} role="menuitem">
          <LogOut size={22} strokeWidth={1.8} />
          <span className="acct-item-text">Logout</span>
        </button>
      </div>
    </div>
  )
}
