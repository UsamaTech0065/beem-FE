import { NextResponse } from 'next/server'
import { callApi, errorResponse } from '../route-helpers'

const CHANNELS = ['sms', 'whatsapp', 'email'] as const
type Channel = (typeof CHANNELS)[number]

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { channel?: Channel; identifier?: string }
    | null

  if (!body?.channel || !CHANNELS.includes(body.channel)) {
    return errorResponse(400, 'Choose how to receive your code.')
  }
  if (!body.identifier?.trim()) {
    return errorResponse(400, body.channel === 'email' ? 'Enter your email address.' : 'Enter your phone number.')
  }

  const result = await callApi('/auth/otp/request', {
    channel: body.channel,
    identifier: body.identifier.trim(),
  })

  if (!result.ok) {
    return errorResponse(result.status, result.message)
  }

  return NextResponse.json(result.data)
}
