'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, FileText } from 'lucide-react'
import { getAddictionDetail } from '@/frontend/lib/api'
import type { AddictionDetail, TriggerCategory } from '@/frontend/lib/types'

// Shows details for one addiction result.
export default function AddictionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const addictionId = params.addictionId as string
  const [detail, setDetail] = useState<AddictionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const [openEvidence, setOpenEvidence] = useState(false)

  useEffect(() => {
    // Loads one result detail record.
    async function loadDetail() {
      const data = await getAddictionDetail(addictionId)
      setDetail(data)
      setLoading(false)
    }
    if (addictionId) {
      loadDetail()
    }
  }, [addictionId])

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="h-8 w-64 animate-pulse rounded" style={{ backgroundColor: 'rgba(227, 155, 99, 0.2)' }} />
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border-2 p-8 text-center" style={{ borderColor: 'rgba(227, 155, 99, 0.2)' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>Addiction not found</p>
          <button
            onClick={() => router.push('/app/results')}
            className="mt-4 rounded-full px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-text-light)',
            }}
          >
            Back to Results
          </button>
        </div>
      </div>
    )
  }

  const categoryLabels: Record<TriggerCategory['category'], string> = {
    temporal: 'Temporal',
    emotional: 'Emotional',
    environmental: 'Environmental',
    cognitive: 'Cognitive',
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <button
        onClick={() => router.back()}
        className="text-sm font-medium transition-colors"
        style={{ color: 'var(--color-accent)' }}
      >
        ← Back to Results
      </button>

      <div>
        <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text-dark)', fontFamily: 'var(--font-primary)' }}>
          {detail.name}
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {detail.confidence}% confidence • Based on conversation patterns
        </p>
      </div>

      
      <div className="space-y-3">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-dark)' }}>
          Trigger Categories
        </h2>
        {detail.triggers.map((category) => (
          <div
            key={category.category}
            className="rounded-lg border-2"
            style={{
              borderColor: 'rgba(227, 155, 99, 0.2)',
              backgroundColor: 'var(--color-card-bg)',
            }}
          >
            <button
              onClick={() => setOpenCategory(openCategory === category.category ? null : category.category)}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--color-text-dark)' }}>
                  {categoryLabels[category.category]}
                </h3>
                <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {category.count} {category.count === 1 ? 'occurrence' : 'occurrences'}
                </p>
              </div>
              {openCategory === category.category ? (
                <ChevronUp className="h-5 w-5" style={{ color: 'var(--color-text-muted)' }} />
              ) : (
                <ChevronDown className="h-5 w-5" style={{ color: 'var(--color-text-muted)' }} />
              )}
            </button>
            {openCategory === category.category && (
              <div className="border-t p-4" style={{ borderColor: 'rgba(227, 155, 99, 0.2)' }}>
                <ul className="space-y-2">
                  {category.triggers.map((trigger, i) => (
                    <li key={i} className="text-sm" style={{ color: 'var(--color-text-dark)' }}>
                      • {trigger}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      
      <div className="rounded-lg border-2" style={{ borderColor: 'rgba(227, 155, 99, 0.2)', backgroundColor: 'var(--color-card-bg)' }}>
        <button
          onClick={() => setOpenEvidence(!openEvidence)}
          className="flex w-full items-center justify-between p-4 text-left"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
            <h3 className="font-semibold" style={{ color: 'var(--color-text-dark)' }}>
              Evidence Excerpts
            </h3>
          </div>
          {openEvidence ? (
            <ChevronUp className="h-5 w-5" style={{ color: 'var(--color-text-muted)' }} />
          ) : (
            <ChevronDown className="h-5 w-5" style={{ color: 'var(--color-text-muted)' }} />
          )}
        </button>
        {openEvidence && (
          <div className="border-t p-4" style={{ borderColor: 'rgba(227, 155, 99, 0.2)' }}>
            <div className="space-y-4">
              {detail.evidence.map((excerpt) => (
                <div key={excerpt.id} className="rounded-lg p-3" style={{ backgroundColor: 'rgba(227, 155, 99, 0.05)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-text-dark)' }}>
                    &quot;{excerpt.excerpt}&quot;
                  </p>
                  <p className="mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(excerpt.timestamp).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


