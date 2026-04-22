'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MessageSquare, Mic } from 'lucide-react'
import { getSessionMessages } from '@/frontend/lib/api'
import type { Message } from '@/frontend/lib/types'

// Shows messages from one session.
export default function SessionHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) return
    // Loads messages for the current session.
    async function loadMessages() {
      const data = await getSessionMessages(sessionId)
      setMessages(data)
      setLoading(false)
    }
    loadMessages()
  }, [sessionId])

  const mode = messages[0]?.mode || 'chat'
  const Icon = mode === 'chat' ? MessageSquare : Mic

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-medium transition-colors"
        style={{ color: 'var(--color-accent)' }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to History
      </button>

      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: 'rgba(227, 155, 99, 0.1)' }}
        >
          <Icon className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
        </div>
        <div>
          <h1 className="text-xl font-semibold capitalize" style={{ color: 'var(--color-text-dark)' }}>
            {mode} Session
          </h1>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {messages.length} {messages.length === 1 ? 'message' : 'messages'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg" style={{ backgroundColor: 'rgba(227, 155, 99, 0.1)' }} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'
                }`}
                style={{
                  backgroundColor:
                    msg.role === 'user'
                      ? 'var(--color-accent)'
                      : 'var(--color-card-bg)',
                  color: msg.role === 'user' ? 'var(--color-text-light)' : 'var(--color-text-dark)',
                }}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p className="mt-1 text-xs opacity-70">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
