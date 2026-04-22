'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BarChart3, Clock3, Flame, UserCircle } from 'lucide-react'
import { useAuthStore } from '@/frontend/lib/store'
import { getResults, getSessions } from '@/frontend/lib/api'
import { readOnboardingState } from '@/frontend/lib/onboarding'
import type { ResultsSummary, SessionSummary } from '@/frontend/lib/types'

// Shows the user profile page.
export default function ProfilePage() {
  const user = useAuthStore((state) => state.user)
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<ResultsSummary | null>(null)
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [triggerCount, setTriggerCount] = useState(0)
  const [averageIntensity, setAverageIntensity] = useState(0)

  useEffect(() => {
    // Loads the data needed for this page.
    async function loadData() {
      const [resultsData, sessionsData] = await Promise.all([getResults(), getSessions()])
      const onboarding = readOnboardingState()
      const logs = onboarding.triggerLogs || []
      const intensity =
        logs.length > 0 ? logs.reduce((sum, item) => sum + (item.intensity || 0), 0) / logs.length : 0

      setResults(resultsData)
      setSessions(sessionsData)
      setTriggerCount(logs.length)
      setAverageIntensity(intensity)
      setLoading(false)
    }

    loadData()
  }, [])

  const lastSessionDate = useMemo(() => {
    if (sessions.length === 0) return 'No sessions yet'
    const latest = sessions
      .map((session) => session.lastMessageAt || session.createdAt)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
    return new Date(latest).toLocaleString()
  }, [sessions])

  const memberSince = useMemo(() => {
    if (!user?.createdAt) return 'Unknown'
    return new Date(user.createdAt).toLocaleDateString()
  }, [user?.createdAt])

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start gap-3">
        <UserCircle className="mt-1 h-8 w-8" style={{ color: 'var(--color-accent)' }} />
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text-dark)', fontFamily: 'var(--font-primary)' }}>
            Profile
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {user?.email || 'Anonymous user'} - Member since {memberSince}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl p-5 shadow-lg" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid rgba(227, 155, 99, 0.2)' }}>
          <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Sessions completed</p>
          <p className="mt-2 text-2xl font-semibold" style={{ color: 'var(--color-text-dark)' }}>{loading ? '-' : results?.sessionsCompleted ?? 0}</p>
        </div>

        <div className="rounded-2xl p-5 shadow-lg" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid rgba(227, 155, 99, 0.2)' }}>
          <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Trigger logs</p>
          <p className="mt-2 text-2xl font-semibold" style={{ color: 'var(--color-text-dark)' }}>{loading ? '-' : triggerCount}</p>
        </div>

        <div className="rounded-2xl p-5 shadow-lg" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid rgba(227, 155, 99, 0.2)' }}>
          <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Average urge intensity</p>
          <p className="mt-2 text-2xl font-semibold" style={{ color: 'var(--color-text-dark)' }}>{loading ? '-' : averageIntensity.toFixed(1)}</p>
        </div>

        <div className="rounded-2xl p-5 shadow-lg" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid rgba(227, 155, 99, 0.2)' }}>
          <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Results status</p>
          <p className="mt-2 text-2xl font-semibold" style={{ color: 'var(--color-text-dark)' }}>
            {loading ? '-' : results?.unlocked ? 'Unlocked' : 'Locked'}
          </p>
        </div>
      </div>

      <div className="rounded-2xl p-6 shadow-lg" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid rgba(227, 155, 99, 0.2)' }}>
        <div className="flex items-center gap-2">
          <Clock3 className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-dark)' }}>Activity</h2>
        </div>
        <p className="mt-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Last session: {loading ? 'Loading...' : lastSessionDate}
        </p>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Total sessions created: {loading ? '-' : sessions.length}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/app/results"
          className="flex items-center gap-3 rounded-lg border-2 p-4 transition-all"
          style={{ borderColor: 'rgba(227, 155, 99, 0.2)', backgroundColor: 'var(--color-card-bg)', color: 'var(--color-text-dark)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-accent)'
            e.currentTarget.style.backgroundColor = 'rgba(227, 155, 99, 0.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(227, 155, 99, 0.2)'
            e.currentTarget.style.backgroundColor = 'var(--color-card-bg)'
          }}
        >
          <BarChart3 className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
          View full analytics
        </Link>

        <Link
          href="/app/sessions"
          className="flex items-center gap-3 rounded-lg border-2 p-4 transition-all"
          style={{ borderColor: 'rgba(227, 155, 99, 0.2)', backgroundColor: 'var(--color-card-bg)', color: 'var(--color-text-dark)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-accent)'
            e.currentTarget.style.backgroundColor = 'rgba(227, 155, 99, 0.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(227, 155, 99, 0.2)'
            e.currentTarget.style.backgroundColor = 'var(--color-card-bg)'
          }}
        >
          <Flame className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
          Review sessions
        </Link>
      </div>
    </div>
  )
}
