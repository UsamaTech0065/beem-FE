import type { Metadata } from 'next'
import { ActionRail } from '@/components/beem/action-rail'
import { CreatePostForm } from '@/components/beem/create-post-form'
import { MobileBottomNav } from '@/components/beem/mobile-bottom-nav'
import { SignInPrompt } from '@/components/beem/sign-in-prompt'
import { TopNav } from '@/components/beem/top-nav'
import { getCurrentUser } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Create Post · beem' }

export default async function CreatePostPage() {
  const user = await getCurrentUser(await getAccessToken())

  return (
    <div className="beem-app">
      <TopNav user={user} />
      {user ? (
        <CreatePostForm handle={user.handle} />
      ) : (
        <main className="fp">
          <SignInPrompt title="your posts" />
        </main>
      )}
      <ActionRail />
      <MobileBottomNav />
    </div>
  )
}
