import { AccountShell } from '@/components/beem/account-shell'
import { ActionRail } from '@/components/beem/action-rail'
import { ChatWorkspace } from '@/components/beem/chat-workspace'
import { TopNav } from '@/components/beem/top-nav'
import { MobileBottomNav } from '@/components/beem/mobile-bottom-nav'
import { getCurrentUser } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function ChatsPage() {
  const user = await getCurrentUser(await getAccessToken())

  // Conversations belong to an account, so a visitor gets the sign-in wall.
  if (!user) {
    return (
      <AccountShell user={null} eyebrow="Chats" title="Chats">
        {null}
      </AccountShell>
    )
  }

  return (
    <main className="beem-app chats-page">
      <TopNav user={user} />
      <ChatWorkspace user={user} />
      <ActionRail />
      <MobileBottomNav />
    </main>
  )
}
