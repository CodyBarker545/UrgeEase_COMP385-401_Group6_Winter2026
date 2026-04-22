'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, MessageSquare, Mic, Calendar } from 'lucide-react'
import { getSessions } from '@/frontend/lib/api'
import type { SessionSummary } from '@/frontend/lib/types'

// Shows previous user sessions.
export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Loads the user session list.
    async function loadSessions() {
      const data = await getSessions()
      setSessions(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
      setLoading(false)
    }
    loadSessions()
  }, [])

  const filteredSessions = sessions.filter((session) =>
    session.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text-dark)', fontFamily: 'var(--font-primary)' }}>
          History
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Browse and review your conversation history
        </p>
      </div>

      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          placeholder="Search sessions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border-2 pl-10 pr-4 py-2 text-sm focus:outline-none"
          style={{
            borderColor: 'rgba(227, 155, 99, 0.2)',
            backgroundColor: 'var(--color-background)',
            color: 'var(--color-text-dark)',
            fontFamily: 'var(--font-primary)',
          }}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg"
              style={{ backgroundColor: 'rgba(227, 155, 99, 0.1)' }}
            />
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div
          className="rounded-lg border-2 border-dashed p-12 text-center"
          style={{
            borderColor: 'rgba(227, 155, 99, 0.3)',
            backgroundColor: 'var(--color-card-bg)',
          }}
        >
          <MessageSquare className="mx-auto h-12 w-12" style={{ color: 'var(--color-text-muted)' }} />
          <h3 className="mt-4 font-semibold" style={{ color: 'var(--color-text-dark)' }}>
            {searchQuery ? 'No sessions found' : 'No sessions yet'}
          </h3>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {searchQuery ? 'Try a different search term' : 'Start a conversation to see it here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => {
            const Icon = session.mode === 'chat' ? MessageSquare : Mic
            const date = new Date(session.createdAt)
            return (
              <Link
                key={session.id}
                href={`/app/history/${session.id}`}
                className="flex items-center gap-4 rounded-lg border-2 p-4 transition-all"
                style={{
                  borderColor: 'rgba(227, 155, 99, 0.2)',
                  backgroundColor: 'var(--color-card-bg)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-accent)'
                  e.currentTarget.style.backgroundColor = 'rgba(227, 155, 99, 0.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(227, 155, 99, 0.2)'
                  e.currentTarget.style.backgroundColor = 'var(--color-card-bg)'
                }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: 'rgba(227, 155, 99, 0.1)' }}
                >
                  <Icon className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize" style={{ color: 'var(--color-text-dark)' }}>
                      {session.mode} Session
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {session.messageCount} {session.messageCount === 1 ? 'message' : 'messages'}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <Calendar className="h-3 w-3" />
                    {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

