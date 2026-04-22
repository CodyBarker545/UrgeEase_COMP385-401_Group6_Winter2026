'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Mic, MessageSquare } from 'lucide-react'

export default function VoiceSessionPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId') || ''

  // Voice is intentionally parked for the demo; send users back to text chat.
  const chatHref = sessionId
    ? `/app/session/chat?sessionId=${sessionId}`
    : '/app/home'

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4">
      <div
        className="w-full rounded-2xl border p-8 text-center shadow-lg"
        style={{
          borderColor: 'rgba(227, 155, 99, 0.2)',
          backgroundColor: 'var(--color-card-bg)',
        }}
      >
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(227, 155, 99, 0.12)' }}
        >
          <Mic className="h-8 w-8" style={{ color: 'var(--color-accent)' }} />
        </div>

        <h1
          className="mt-5 text-2xl font-semibold"
          style={{
            color: 'var(--color-text-dark)',
            fontFamily: 'var(--font-primary)',
          }}
        >
          Voice support is coming soon
        </h1>
        <p className="mt-3 text-sm leading-6" style={{ color: 'var(--color-text-muted)' }}>
          This demo currently supports text chat only. Voice recording, transcription, and audio playback are planned for a future version.
        </p>

        <Link
          href={chatHref}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-all"
          style={{
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-text-light)',
          }}
        >
          <MessageSquare className="h-4 w-4" />
          Continue in chat
        </Link>
      </div>
    </div>
  )
}
