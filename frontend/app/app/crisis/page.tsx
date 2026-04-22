'use client'

import { Phone, MessageCircle, Globe } from 'lucide-react'

// Shows the crisis support page.
export default function CrisisPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text-dark)', fontFamily: 'var(--font-primary)' }}>
          Crisis Resources
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Immediate support when you need it most
        </p>
      </div>

      
      <div
        className="rounded-lg border-2 p-6 text-center"
        style={{
          borderColor: '#dc2626',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
        }}
      >
        <h2 className="text-2xl font-bold" style={{ color: '#dc2626' }}>
          If you are in immediate danger, call 911
        </h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-dark)' }}>
          Emergency services are available 24/7
        </p>
      </div>

      
      <div
        className="rounded-lg border-2 p-6"
        style={{
          borderColor: 'rgba(227, 155, 99, 0.2)',
          backgroundColor: 'var(--color-card-bg)',
        }}
      >
        <div className="mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
          <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-dark)' }}>
            Canada
          </h2>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
              <h3 className="font-semibold" style={{ color: 'var(--color-text-dark)' }}>
                Crisis Services Canada
              </h3>
            </div>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-dark)' }}>
              <strong>1-833-456-4566</strong> (24/7)
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Free, confidential support for anyone in Canada
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
              <h3 className="font-semibold" style={{ color: 'var(--color-text-dark)' }}>
                Kids Help Phone
              </h3>
            </div>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-dark)' }}>
              <strong>1-800-668-6868</strong>
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Support for young people under 20
            </p>
          </div>
        </div>
      </div>

      
      <div
        className="rounded-lg border-2 p-6"
        style={{
          borderColor: 'rgba(227, 155, 99, 0.2)',
          backgroundColor: 'var(--color-card-bg)',
        }}
      >
        <div className="mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
          <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-dark)' }}>
            United States
          </h2>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
              <h3 className="font-semibold" style={{ color: 'var(--color-text-dark)' }}>
                988 Suicide & Crisis Lifeline
              </h3>
            </div>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-dark)' }}>
              <strong>988</strong> (24/7)
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Free, confidential support for anyone in crisis
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
              <h3 className="font-semibold" style={{ color: 'var(--color-text-dark)' }}>
                Crisis Text Line
              </h3>
            </div>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-dark)' }}>
              Text <strong>HOME</strong> to <strong>741741</strong>
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Free 24/7 crisis support via text message
            </p>
          </div>
        </div>
      </div>

      
      <div
        className="rounded-lg border-2 p-4"
        style={{
          borderColor: 'rgba(227, 155, 99, 0.2)',
          backgroundColor: 'rgba(227, 155, 99, 0.05)',
        }}
      >
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <strong style={{ color: 'var(--color-text-dark)' }}>Important:</strong> UrgeEase is not a substitute for professional mental health care. If you&apos;re experiencing a mental health crisis, please contact emergency services or a crisis hotline immediately.
        </p>
      </div>
    </div>
  )
}

