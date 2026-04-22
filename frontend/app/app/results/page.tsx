'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart3, CalendarDays, ListChecks, Lock, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { getResults } from '@/frontend/lib/api'
import type { ResultsSummary } from '@/frontend/lib/types'

// Formats a date for display.
function formatDate(value: string | null) {
  if (!value) return 'Unknown date'
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Formats the score change text.
function formatScoreChange(change: number | null) {
  if (change === null) return 'No comparison yet'
  if (change === 0) return 'No score change'
  return `${change > 0 ? '+' : ''}${change} from previous`
}

// Shows the icon for the result trend.
function TrendIcon({ trend }: { trend: NonNullable<ResultsSummary['analytics']>['trend'] }) {
  if (trend === 'improved') return <TrendingDown className="h-5 w-5" style={{ color: '#22c55e' }} />
  if (trend === 'worsened') return <TrendingUp className="h-5 w-5" style={{ color: '#dc2626' }} />
  return <Minus className="h-5 w-5" style={{ color: 'var(--color-text-muted)' }} />
}

// Shows the user assessment results.
export default function ResultsPage() {
  const [results, setResults] = useState<ResultsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Loads the user results summary.
    async function loadResults() {
      const data = await getResults()
      setResults(data)
      setLoading(false)
    }
    loadResults()
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="h-8 w-64 animate-pulse rounded" style={{ backgroundColor: 'rgba(227, 155, 99, 0.2)' }} />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
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
            Complete an assessment to unlock your personalized results dashboard.
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            You&apos;ve completed {results?.sessionsCompleted || 0} session{results?.sessionsCompleted !== 1 ? 's' : ''}.
          </p>
          <Link
            href="/app/assessment"
            className="mt-6 rounded-full px-6 py-3 text-sm font-medium transition-all"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-text-light)',
            }}
          >
            Take Assessment
          </Link>
        </div>
      </div>
    )
  }

  const analytics = results.analytics
  const latest = analytics?.latest
  const previous = analytics?.previous
  const score = latest?.addictionScore ?? null
  const scorePercent = score === null ? 0 : Math.max(0, Math.min(100, Math.round((score / 9) * 100)))

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text-dark)', fontFamily: 'var(--font-primary)' }}>
          Results Dashboard
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Assessment trends, trigger patterns, and plan progress over time.
        </p>
      </div>

      {analytics && (
        <div
          className="rounded-2xl p-6 shadow-lg"
          style={{
            backgroundColor: 'var(--color-card-bg)',
            border: '1px solid rgba(227, 155, 99, 0.2)',
          }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <TrendIcon trend={analytics.trend} />
                <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-dark)' }}>
                  {analytics.trend === 'improved'
                    ? 'Improving'
                    : analytics.trend === 'worsened'
                      ? 'Needs Attention'
                      : analytics.trend === 'unchanged'
                        ? 'Stable'
                        : 'Baseline'}
                </h2>
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: 'var(--color-text-muted)' }}>
                {analytics.summary}
              </p>
            </div>
            <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: 'rgba(227, 155, 99, 0.1)', color: 'var(--color-text-dark)' }}>
              {analytics.assessmentCount} assessment{analytics.assessmentCount !== 1 ? 's' : ''} recorded
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl p-5 shadow-lg" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid rgba(227, 155, 99, 0.2)' }}>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Latest score</p>
          <p className="mt-2 text-3xl font-semibold" style={{ color: 'var(--color-text-dark)' }}>{score ?? '-'}</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(227, 155, 99, 0.2)' }}>
            <div className="h-full" style={{ width: `${scorePercent}%`, backgroundColor: 'var(--color-accent)' }} />
          </div>
        </div>
        <div className="rounded-2xl p-5 shadow-lg" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid rgba(227, 155, 99, 0.2)' }}>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Change</p>
          <p className="mt-2 text-2xl font-semibold" style={{ color: 'var(--color-text-dark)' }}>{formatScoreChange(analytics?.scoreChange ?? null)}</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {previous ? `Compared with ${formatDate(previous.generatedAt)}` : 'Future assessments will compare against this baseline.'}
          </p>
        </div>
        <div className="rounded-2xl p-5 shadow-lg" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid rgba(227, 155, 99, 0.2)' }}>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Current risk</p>
          <p className="mt-2 text-2xl font-semibold" style={{ color: 'var(--color-text-dark)' }}>{latest?.addictionRiskLevel ?? 'Unknown'}</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Dependence risk: {latest?.dependenceRiskLevel ?? 'Unknown'}
          </p>
        </div>
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

      {analytics?.recurringTriggers?.length ? (
        <section className="rounded-2xl p-6 shadow-lg" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid rgba(227, 155, 99, 0.2)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-dark)' }}>Recurring Triggers</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {analytics.recurringTriggers.slice(0, 6).map((item) => (
              <span
                key={item.trigger}
                className="rounded-full px-3 py-1 text-xs"
                style={{ backgroundColor: 'rgba(227, 155, 99, 0.12)', color: 'var(--color-accent)' }}
              >
                {item.trigger} ({item.count})
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {analytics?.timeline?.length ? (
        <section className="rounded-2xl p-6 shadow-lg" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid rgba(227, 155, 99, 0.2)' }}>
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-dark)' }}>Assessment Timeline</h2>
          </div>
          <div className="space-y-3">
            {[...analytics.timeline].reverse().map((item) => (
              <div key={item.resultId ?? item.assessmentNumber} className="rounded-lg border p-4" style={{ borderColor: 'rgba(227, 155, 99, 0.2)' }}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-dark)' }}>
                      Assessment {item.assessmentNumber}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>{formatDate(item.generatedAt)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm sm:text-right">
                    <div>
                      <p style={{ color: 'var(--color-text-muted)' }}>Score</p>
                      <p className="font-semibold" style={{ color: 'var(--color-text-dark)' }}>{item.addictionScore ?? '-'}</p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--color-text-muted)' }}>Risk</p>
                      <p className="font-semibold" style={{ color: 'var(--color-text-dark)' }}>{item.addictionRiskLevel ?? 'Unknown'}</p>
                    </div>
                  </div>
                </div>
                {item.topTriggers.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.topTriggers.slice(0, 4).map((trigger) => (
                      <span key={trigger} className="rounded-full px-2 py-1 text-xs" style={{ backgroundColor: 'rgba(227, 155, 99, 0.08)', color: 'var(--color-text-muted)' }}>
                        {trigger}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}

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
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-dark)' }}>
                  {addiction.name}
                </h3>
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
                {addiction.confidence}% confidence
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Open detailed triggers and recommendations.
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
