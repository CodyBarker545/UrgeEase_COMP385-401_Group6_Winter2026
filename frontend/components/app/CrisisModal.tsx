'use client'

import { useRouter } from 'next/navigation'
import { AlertCircle, X } from 'lucide-react'

interface CrisisModalProps {
  onClose: () => void
}

// Shows crisis support actions in a modal.
export function CrisisModal({ onClose }: CrisisModalProps) {
  const router = useRouter()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-xl"
        style={{ backgroundColor: 'var(--color-card-bg)' }}
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)' }}
            >
              <AlertCircle className="h-6 w-6" style={{ color: '#dc2626' }} />
            </div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-dark)' }}>
              Crisis Resources
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1"
            aria-label="Close"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div
            className="rounded-lg border-2 p-4"
            style={{
              borderColor: '#dc2626',
              backgroundColor: 'rgba(220, 38, 38, 0.05)',
            }}
          >
            <p className="text-lg font-semibold" style={{ color: '#dc2626' }}>
              If you are in immediate danger, call 911
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="mb-2 font-semibold" style={{ color: 'var(--color-text-dark)' }}>
                Canada
              </h3>
              <ul className="space-y-1 text-sm" style={{ color: 'var(--color-text-dark)' }}>
                <li>
                  <strong>Crisis Services Canada:</strong> 1-833-456-4566 (24/7)
                </li>
                <li>
                  <strong>Kids Help Phone:</strong> 1-800-668-6868
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-2 font-semibold" style={{ color: 'var(--color-text-dark)' }}>
                United States
              </h3>
              <ul className="space-y-1 text-sm" style={{ color: 'var(--color-text-dark)' }}>
                <li>
                  <strong>988 Suicide & Crisis Lifeline:</strong> 988 (24/7)
                </li>
                <li>
                  <strong>Crisis Text Line:</strong> Text HOME to 741741
                </li>
              </ul>
            </div>
          </div>

          <div
            className="rounded-lg p-3 text-xs"
            style={{ backgroundColor: 'rgba(227, 155, 99, 0.1)' }}
          >
            <p style={{ color: 'var(--color-text-muted)' }}>
              UrgeEase is not a substitute for professional mental health care. If you&apos;re experiencing a crisis, please contact emergency services or a crisis hotline.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all"
              style={{
                borderColor: 'rgba(227, 155, 99, 0.3)',
                color: 'var(--color-text-dark)',
              }}
            >
              Close
            </button>
            <button
              onClick={() => {
                router.push('/app/crisis')
                onClose()
              }}
              className="flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-text-light)',
              }}
            >
              View Full Resources
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
