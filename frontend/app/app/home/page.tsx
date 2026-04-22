'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MessageSquare, BarChart3, ClipboardList } from 'lucide-react'
import { createSession, getResults } from '@/frontend/lib/api'
import { useRouter } from 'next/navigation'

// Shows the signed-in home page.
export default function HomePage() {
  const router = useRouter()
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const [hasPlan, setHasPlan] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Loads the data needed for this page.
    async function loadData() {
      const results = await getResults()
      setSessionsCompleted(results.sessionsCompleted)
      setHasPlan(Boolean(results.activePlan))
      setLoading(false)
    }
    loadData()
  }, [])

  // Handles handle start session.
  const handleStartSession = async (mode: 'chat' | 'voice') => {
    const { sessionId } = await createSession({ mode })
    router.push(`/app/session/${mode}?sessionId=${sessionId}`)
  }

  const resultsUnlocked = sessionsCompleted >= 3
  const progressGoal = 5
  const displayedSessionsCompleted = Math.min(sessionsCompleted, progressGoal)
  const sessionsUntilUnlock = Math.max(3 - sessionsCompleted, 0)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text-dark)', fontFamily: 'var(--font-primary)' }}>
          Welcome back
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Continue your journey with private, judgment-free support.
        </p>
      </div>

      
      <div
        className="rounded-2xl p-6 shadow-lg"
        style={{
          backgroundColor: 'var(--color-card-bg)',
          border: '1px solid rgba(227, 155, 99, 0.2)',
        }}
      >
        <h2 className="mb-4 text-lg font-semibold" style={{ color: 'var(--color-text-dark)' }}>
          Continue
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => handleStartSession('chat')}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition-all"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-text-light)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-accent-dark)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-accent)'
            }}
          >
            <MessageSquare className="h-5 w-5" />
            Start Chat
          </button>
        </div>
      </div>

      
      <div
        className="rounded-2xl p-6 shadow-lg"
        style={{
          backgroundColor: 'var(--color-card-bg)',
          border: '1px solid rgba(227, 155, 99, 0.2)',
        }}
      >
        <h2 className="mb-2 text-lg font-semibold" style={{ color: 'var(--color-text-dark)' }}>
          Progress
        </h2>
        {loading ? (
          <div className="h-8 w-48 animate-pulse rounded" style={{ backgroundColor: 'rgba(227, 155, 99, 0.2)' }} />
        ) : (
          <>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Sessions completed: <strong style={{ color: 'var(--color-text-dark)' }}>{displayedSessionsCompleted}/{progressGoal}</strong>
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(227, 155, 99, 0.2)' }}>
              <div
                className="h-full transition-all"
                style={{
                  width: `${(displayedSessionsCompleted / progressGoal) * 100}%`,
                  backgroundColor: 'var(--color-accent)',
                }}
              />
            </div>
            <p className="mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {resultsUnlocked
                ? 'Results dashboard unlocked!'
                : `Complete ${sessionsUntilUnlock} more ${sessionsUntilUnlock === 1 ? 'session' : 'sessions'} to unlock results.`}
            </p>
          </>
        )}
      </div>

      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {hasPlan && (
            <Link
              href="/app/plan"
            className="flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all"
            style={{
              borderColor: 'rgba(227, 155, 99, 0.2)',
              backgroundColor: 'var(--color-card-bg)',
              color: 'var(--color-text-dark)',
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
            <ClipboardList className="h-6 w-6" style={{ color: 'var(--color-accent)' }} />
            <span className="text-sm font-medium">My Plan</span>
          </Link>
          )}

          <Link
            href="/app/assessment"
          className="flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all"
          style={{
            borderColor: 'rgba(227, 155, 99, 0.2)',
            backgroundColor: 'var(--color-card-bg)',
            color: 'var(--color-text-dark)',
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
          <ClipboardList className="h-6 w-6" style={{ color: 'var(--color-accent)' }} />
          <span className="text-sm font-medium">Take Assessment</span>
        </Link>

          <Link
            href="/app/sessions"
          className="flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all"
          style={{
            borderColor: 'rgba(227, 155, 99, 0.2)',
            backgroundColor: 'var(--color-card-bg)',
            color: 'var(--color-text-dark)',
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
          <MessageSquare className="h-6 w-6" style={{ color: 'var(--color-accent)' }} />
          <span className="text-sm font-medium">View Sessions</span>
        </Link>

          <Link
            href={resultsUnlocked ? '/app/results' : '#'}
          className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all ${
            !resultsUnlocked ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          style={{
            borderColor: 'rgba(227, 155, 99, 0.2)',
            backgroundColor: 'var(--color-card-bg)',
            color: 'var(--color-text-dark)',
          }}
          onClick={(e) => {
            if (!resultsUnlocked) e.preventDefault()
          }}
          onMouseEnter={(e) => {
            if (resultsUnlocked) {
              e.currentTarget.style.borderColor = 'var(--color-accent)'
              e.currentTarget.style.backgroundColor = 'rgba(227, 155, 99, 0.05)'
            }
          }}
          onMouseLeave={(e) => {
            if (resultsUnlocked) {
              e.currentTarget.style.borderColor = 'rgba(227, 155, 99, 0.2)'
              e.currentTarget.style.backgroundColor = 'var(--color-card-bg)'
            }
          }}
        >
          <BarChart3 className="h-6 w-6" style={{ color: 'var(--color-accent)' }} />
          <span className="text-sm font-medium">View Results</span>
          {!resultsUnlocked && <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Locked</span>}
        </Link>

          <Link
            href="/app/sessions"
          className="flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all"
          style={{
            borderColor: 'rgba(227, 155, 99, 0.2)',
            backgroundColor: 'var(--color-card-bg)',
            color: 'var(--color-text-dark)',
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
          <MessageSquare className="h-6 w-6" style={{ color: 'var(--color-accent)' }} />
          <span className="text-sm font-medium">View Sessions</span>
        </Link>
      </div>

      
      <div className="rounded-lg p-4 text-center text-xs" style={{ backgroundColor: 'rgba(227, 155, 99, 0.05)' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Stored locally by default. Your conversations are private.
        </p>
      </div>
    </div>
  )
}

