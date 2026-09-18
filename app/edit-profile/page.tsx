import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { ActionRail } from '@/components/beem/action-rail'
import { EditProfileForm } from '@/components/beem/edit-profile-form'
import { MobileBottomNav } from '@/components/beem/mobile-bottom-nav'
import { SignInPrompt } from '@/components/beem/sign-in-prompt'
import { TopNav } from '@/components/beem/top-nav'
import { getCurrentUser, getEditableProfile } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Edit Profile · beem' }

export default async function EditProfilePage() {
  const accessToken = await getAccessToken()
  const [user, profile, requestHeaders] = await Promise.all([
    getCurrentUser(accessToken),
    getEditableProfile(accessToken),
    headers(),
  ])
  const siteHost = (requestHeaders.get('host') ?? 'beem.app').replace(/^www\./, '')

  return (
    <div className="beem-app">
      <TopNav user={user} />
      {profile ? (
        <EditProfileForm profile={profile} siteHost={siteHost} />
      ) : (
        <main className="fp">
          <SignInPrompt title="your profile" />
        </main>
      )}
      <ActionRail />
      <MobileBottomNav />
    </div>
  )
}
