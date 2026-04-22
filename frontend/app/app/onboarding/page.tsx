'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Mic, Video, Check } from 'lucide-react'
import { useOnboardingStore } from '@/frontend/lib/store'

// Shows the onboarding flow.
export default function OnboardingPage() {
  const router = useRouter()
  const completeOnboarding = useOnboardingStore((state) => state.completeOnboarding)
  const [step, setStep] = useState(1)
  const [preferredMode, setPreferredMode] = useState<'chat' | null>(null)
  const [tone, setTone] = useState<'calm' | 'direct' | null>(null)

  // Marks onboarding as finished.
  const handleFinish = () => {
    if (preferredMode && tone) {
      completeOnboarding({ preferredMode, tone })
      router.push('/app/home')
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text-dark)', fontFamily: 'var(--font-primary)' }}>
              Welcome to UrgeEase
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              UrgeEase is an offline recovery support tool for social media and pornography addiction. After 3-5 conversations, you&apos;ll see a results dashboard with identified triggers and patterns.
            </p>
          </div>

          <div
            className="rounded-lg border-2 p-4"
            style={{
              borderColor: 'rgba(220, 38, 38, 0.3)',
              backgroundColor: 'rgba(220, 38, 38, 0.05)',
            }}
          >
            <p className="text-sm font-medium" style={{ color: '#dc2626' }}>
              Important
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              UrgeEase is not a substitute for professional mental health care. If you&apos;re in immediate danger or crisis, use emergency resources.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold" style={{ color: 'var(--color-text-dark)' }}>
              Choose your support mode
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => setPreferredMode('chat')}
                className={`flex flex-col items-center gap-3 rounded-lg border-2 p-6 text-center transition-all ${
                  preferredMode === 'chat' ? 'border-opacity-100' : 'border-opacity-30'
                }`}
                style={{
                  borderColor: preferredMode === 'chat' ? 'var(--color-accent)' : 'rgba(227, 155, 99, 0.3)',
                  backgroundColor: preferredMode === 'chat' ? 'rgba(227, 155, 99, 0.1)' : 'var(--color-card-bg)',
                }}
              >
                <MessageSquare className="h-8 w-8" style={{ color: 'var(--color-accent)' }} />
                <div>
                  <div className="font-semibold" style={{ color: 'var(--color-text-dark)' }}>Chat</div>
                  <div className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>Text-based conversations</div>
                </div>
                {preferredMode === 'chat' && <Check className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />}
              </button>

              <button
                type="button"
                disabled
                className="flex cursor-not-allowed flex-col items-center gap-3 rounded-lg border-2 p-6 text-center opacity-60"
                style={{
                  borderColor: 'rgba(227, 155, 99, 0.3)',
                  backgroundColor: 'var(--color-card-bg)',
                }}
              >
                <Mic className="h-8 w-8" style={{ color: 'var(--color-accent)' }} />
                <div>
                  <div className="font-semibold" style={{ color: 'var(--color-text-dark)' }}>Voice</div>
                  <div className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>Coming soon</div>
                </div>
              </button>
            </div>

            <div className="mt-4 rounded-lg border p-4" style={{ borderColor: 'rgba(227, 155, 99, 0.2)', backgroundColor: 'rgba(227, 155, 99, 0.05)' }}>
              <div className="flex items-start gap-3">
                <Video className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--color-text-dark)' }}>Voice and video avatar</div>
                  <div className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>Coming soon. The demo currently uses text chat only.</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!preferredMode}
              className="mt-6 w-full rounded-full px-6 py-3 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: preferredMode ? 'var(--color-accent)' : 'rgba(227, 155, 99, 0.5)',
                color: 'var(--color-text-light)',
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold" style={{ color: 'var(--color-text-dark)' }}>Tone preference</h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              How would you like UrgeEase to communicate with you?
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setTone('calm')}
              className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                tone === 'calm' ? 'border-opacity-100' : 'border-opacity-30'
              }`}
              style={{
                borderColor: tone === 'calm' ? 'var(--color-accent)' : 'rgba(227, 155, 99, 0.3)',
                backgroundColor: tone === 'calm' ? 'rgba(227, 155, 99, 0.1)' : 'var(--color-card-bg)',
              }}
            >
              <div className="font-semibold" style={{ color: 'var(--color-text-dark)' }}>Calm</div>
              <div className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Gentle, supportive, and patient. Takes time to explore feelings.
              </div>
              {tone === 'calm' && <Check className="mt-2 h-5 w-5" style={{ color: 'var(--color-accent)' }} />}
            </button>

            <button
              onClick={() => setTone('direct')}
              className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                tone === 'direct' ? 'border-opacity-100' : 'border-opacity-30'
              }`}
              style={{
                borderColor: tone === 'direct' ? 'var(--color-accent)' : 'rgba(227, 155, 99, 0.3)',
                backgroundColor: tone === 'direct' ? 'rgba(227, 155, 99, 0.1)' : 'var(--color-card-bg)',
              }}
            >
              <div className="font-semibold" style={{ color: 'var(--color-text-dark)' }}>Direct</div>
              <div className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Straightforward and action-oriented. Gets to the point quickly.
              </div>
              {tone === 'direct' && <Check className="mt-2 h-5 w-5" style={{ color: 'var(--color-accent)' }} />}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all"
              style={{
                borderColor: 'rgba(227, 155, 99, 0.3)',
                color: 'var(--color-text-dark)',
              }}
            >
              Back
            </button>
            <button
              onClick={handleFinish}
              disabled={!tone}
              className="flex-1 rounded-full px-6 py-3 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: tone ? 'var(--color-accent)' : 'rgba(227, 155, 99, 0.5)',
                color: 'var(--color-text-light)',
              }}
            >
              Finish
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
