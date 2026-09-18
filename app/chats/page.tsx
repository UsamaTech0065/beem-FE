import { AccountShell } from '@/components/beem/account-shell'
import { ActionRail } from '@/components/beem/action-rail'
import { ChatWorkspace } from '@/components/beem/chat-workspace'
import { TopNav } from '@/components/beem/top-nav'
import { MobileBottomNav } from '@/components/beem/mobile-bottom-nav'
import { getCurrentUser } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<{ c?: string }> }

export default async function ChatsPage({ searchParams }: Props) {
  const [user, { c: initialChatId }] = await Promise.all([getCurrentUser(await getAccessToken()), searchParams])

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
      <ChatWorkspace user={user} initialChatId={initialChatId ?? null} />
      <ActionRail />
      <MobileBottomNav />
    </main>
  )
}
