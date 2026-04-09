'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart3, Lock, ListChecks } from 'lucide-react'
import { getResults } from '@/frontend/lib/api'
import type { ResultsSummary } from '@/frontend/lib/types'

export default function ResultsPage() {
  const [results, setResults] = useState<ResultsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadResults() {
      const data = await getResults()
      setResults(data)
      setLoading(false)
    }
    loadResults()
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="h-8 w-64 animate-pulse rounded" style={{ backgroundColor: 'rgba(227, 155, 99, 0.2)' }} />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg" style={{ backgroundColor: 'rgba(227, 155, 99, 0.1)' }} />
          ))}
        </div>
      </div>
    )
  }

  if (!results || !results.unlocked) {
    return (
      <div className="mx-auto max-w-2xl">
        <div
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center"
          style={{
            borderColor: 'rgba(227, 155, 99, 0.3)',
            backgroundColor: 'var(--color-card-bg)',
          }}
        >
          <Lock className="h-16 w-16" style={{ color: 'var(--color-text-muted)' }} />
          <h2 className="mt-4 text-2xl font-semibold" style={{ color: 'var(--color-text-dark)' }}>
            Results Dashboard Locked
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Complete 3–5 conversations to unlock your personalized results dashboard.
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            You&apos;ve completed {results?.sessionsCompleted || 0} session{results?.sessionsCompleted !== 1 ? 's' : ''}.
          </p>
          <Link
            href="/app/home"
            className="mt-6 rounded-full px-6 py-3 text-sm font-medium transition-all"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-text-light)',
            }}
          >
            Start a Session
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text-dark)', fontFamily: 'var(--font-primary)' }}>
          Results Dashboard
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Insights from {results.sessionsCompleted} conversations
        </p>
      </div>

      {results.activePlan && (
        <Link
          href="/app/plan"
          className="block rounded-lg border-2 p-6 transition-all"
          style={{
            borderColor: 'rgba(227, 155, 99, 0.2)',
            backgroundColor: 'var(--color-card-bg)',
          }}
        >
          <div className="flex items-center gap-3">
            <ListChecks className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-dark)' }}>Active Recovery Plan</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {results.activePlan.summary}
              </p>
            </div>
          </div>
        </Link>
      )}

      <div className="space-y-4">
        {results.addictions.map((addiction) => (
          <Link
            key={addiction.id}
            href={`/app/results/${addiction.id}`}
            className="block rounded-lg border-2 p-6 transition-all"
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
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-dark)' }}>
                {addiction.name}
              </h3>
              <span className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
                {addiction.confidence}% confidence
              </span>
            </div>
            <div className="mb-3 h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(227, 155, 99, 0.2)' }}>
              <div
                className="h-full transition-all"
                style={{
                  width: `${addiction.confidence}%`,
                  backgroundColor: 'var(--color-accent)',
                }}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                Top Triggers
              </p>
              <div className="flex flex-wrap gap-2">
                {addiction.topTriggers.map((trigger, i) => (
                  <span
                    key={i}
                    className="rounded-full px-3 py-1 text-xs"
                    style={{
                      backgroundColor: 'rgba(227, 155, 99, 0.1)',
                      color: 'var(--color-accent)',
                    }}
                  >
                    {trigger}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
