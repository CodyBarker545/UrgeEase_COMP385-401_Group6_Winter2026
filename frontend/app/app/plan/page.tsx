'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, ListChecks } from 'lucide-react'

import { getActivePlan, updatePlanAction } from '@/frontend/lib/api'
import type { RecoveryPlan } from '@/frontend/lib/types'

export default function PlanPage() {
  const [plan, setPlan] = useState<RecoveryPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingAction, setUpdatingAction] = useState<string | null>(null)

  useEffect(() => {
    async function loadPlan() {
      const data = await getActivePlan()
      setPlan(data)
      setLoading(false)
    }

    loadPlan()
  }, [])

  const toggleAction = async (actionId: string, completed: boolean) => {
    if (!plan) return
    setUpdatingAction(actionId)
    try {
      const updated = await updatePlanAction(plan.planId, actionId, completed)
      setPlan(updated)
    } finally {
      setUpdatingAction(null)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="h-8 w-40 animate-pulse rounded" style={{ backgroundColor: 'rgba(227, 155, 99, 0.2)' }} />
        <div className="h-40 animate-pulse rounded-2xl" style={{ backgroundColor: 'rgba(227, 155, 99, 0.08)' }} />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border-2 border-dashed p-10 text-center"
        style={{
          borderColor: 'rgba(227, 155, 99, 0.3)',
          backgroundColor: 'var(--color-card-bg)',
        }}>
        <ListChecks className="mx-auto h-10 w-10" style={{ color: 'var(--color-accent)' }} />
        <h1 className="mt-4 text-2xl font-semibold" style={{ color: 'var(--color-text-dark)' }}>No Active Plan Yet</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Complete an assessment to generate a practical recovery plan.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text-dark)', fontFamily: 'var(--font-primary)' }}>
          Recovery Plan
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Focus area: <strong style={{ color: 'var(--color-text-dark)' }}>{plan.focusArea ?? 'general support'}</strong>
          {' '}• Risk level: <strong style={{ color: 'var(--color-text-dark)' }}>{plan.riskLevel ?? 'Unknown'}</strong>
        </p>
      </div>

      <div className="rounded-2xl p-6 shadow-lg"
        style={{
          backgroundColor: 'var(--color-card-bg)',
          border: '1px solid rgba(227, 155, 99, 0.2)',
        }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-dark)' }}>Current Focus</h2>
        <p className="mt-3 text-sm leading-6" style={{ color: 'var(--color-text-muted)' }}>
          {plan.summary}
        </p>
        <div className="mt-4 space-y-2">
          {plan.goals.map((goal) => (
            <p key={goal} className="text-sm" style={{ color: 'var(--color-text-dark)' }}>
              • {goal}
            </p>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-6 shadow-lg"
        style={{
          backgroundColor: 'var(--color-card-bg)',
          border: '1px solid rgba(227, 155, 99, 0.2)',
        }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-dark)' }}>Action Steps</h2>
        <div className="mt-4 space-y-3">
          {plan.actions.map((action) => (
            <button
              key={action.id}
              onClick={() => toggleAction(action.id, !action.completed)}
              disabled={updatingAction === action.id}
              className="flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all disabled:opacity-60"
              style={{
                borderColor: action.completed ? 'rgba(34, 197, 94, 0.35)' : 'rgba(227, 155, 99, 0.2)',
                backgroundColor: action.completed ? 'rgba(34, 197, 94, 0.08)' : 'transparent',
              }}
            >
              {action.completed ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5" style={{ color: '#22c55e' }} />
              ) : (
                <Circle className="mt-0.5 h-5 w-5" style={{ color: 'var(--color-accent)' }} />
              )}
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-dark)' }}>{action.title}</p>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
