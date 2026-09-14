import type { ReactNode } from 'react'
import type { CurrentUser } from '@/lib/api-types'
import { ActionRail } from './action-rail'
import { MobileBottomNav } from './mobile-bottom-nav'
import { SignInPrompt } from './sign-in-prompt'
import { TopNav } from './top-nav'

type Props = {
  user: CurrentUser | null
  eyebrow: string
  title: string
  subtitle?: string
  /** Buttons rendered to the right of the title. */
  actions?: ReactNode
  children: ReactNode
}

/**
 * Frame for every page behind the account menu. Signed-out visitors see a
 * sign-in prompt in place of the content, so links can be shared safely.
 */
export function AccountShell({ user, eyebrow, title, subtitle, actions, children }: Props) {
  return (
    <div className="beem-app">
      <TopNav user={user} />
      <main className="tg-main acct-main">
        {user ? (
          <>
            <header className="acct-head">
              <div>
                <p className="acct-eyebrow">{eyebrow}</p>
                <h1>{title}</h1>
                {subtitle && <p className="acct-subtitle">{subtitle}</p>}
              </div>
              {actions && <div className="acct-head-actions">{actions}</div>}
            </header>
            {children}
          </>
        ) : (
          <SignInPrompt title={title} />
        )}
      </main>
      <ActionRail />
      <MobileBottomNav />
    </div>
  )
}
