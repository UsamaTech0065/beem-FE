import { NextResponse } from 'next/server'
import { forwardToApi } from '@/lib/server-api'

/** Save the withdrawal method (PayPal email, or bank details). */
export async function PUT(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ message: 'Nothing to save.' }, { status: 400 })
  return forwardToApi('/payouts/method', { auth: 'required', method: 'PUT', body })
}
