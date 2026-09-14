import { ActionRail } from '@/components/beem/action-rail'
import { ChatWorkspace } from '@/components/beem/chat-workspace'
import { TopNav } from '@/components/beem/top-nav'
import { MobileBottomNav } from '@/components/beem/mobile-bottom-nav'
import { getCurrentUser } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function ChatsPage() {
  const user = await getCurrentUser(await getAccessToken())

  return (
    <main className="beem-app chats-page">
      <TopNav user={user} />
      <ChatWorkspace />
      <ActionRail />
      <MobileBottomNav />
    </main>
  )
}
