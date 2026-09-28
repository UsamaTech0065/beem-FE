import { NextResponse } from 'next/server'
import { forwardToApi } from '@/lib/server-api'

/** Start (or continue) Stripe onboarding; answers the URL to send the person to. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { country?: unknown } | null
  if (typeof body?.country !== 'string') return NextResponse.json({ message: 'Choose your country.' }, { status: 400 })
  return forwardToApi('/payouts/stripe/onboard', { auth: 'required', body: { country: body.country } })
}
