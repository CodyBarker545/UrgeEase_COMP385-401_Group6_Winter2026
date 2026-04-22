'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/frontend/contexts/AuthContext'
import PanicFlow from '@/frontend/components/PanicFlow'
import PersonalizationBanner from '@/frontend/components/PersonalizationBanner'
import ChatOnboarding from '@/frontend/components/ChatOnboarding'
import { OnboardingState, readOnboardingState } from '@/frontend/lib/onboarding'


// Handles dashboard page.
export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null)
  const [panicOpen, setPanicOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])
  useEffect(() => {
    if (panicOpen) return 
    
    try {
      const stored = readOnboardingState()
      setOnboardingState(stored)
    } catch (error) {
      console.error('Failed to read onboarding state:', error)
      setOnboardingState(null)
    }
  }, [panicOpen])

  const daysSinceOnboarding = useMemo(() => {
    if (!onboardingState?.userSettings.onboardingCompletedAt) return 0
    try {
      const completedDate = new Date(onboardingState.userSettings.onboardingCompletedAt)
      if (isNaN(completedDate.getTime())) return 0
      const diff = Date.now() - completedDate.getTime()
      return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
    } catch (error) {
      console.error('Error calculating days since onboarding:', error)
      return 0
    }
  }, [onboardingState])

  const panicUses = onboardingState?.triggerLogs.length ?? 0

  const patternInsights = useMemo(() => {
    const logs = onboardingState?.triggerLogs ?? []
    return logs.slice(-3).map((log) => {
      try {
        const date = new Date(log.timestamp)
        const timeOfDay = isNaN(date.getTime()) 
          ? 'Unknown' 
          : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        return {
          intensity: log.intensity ?? 0,
          emotion: log.emotion ?? 'Unknown',
          timeOfDay,
        }
      } catch (error) {
        console.error('Error processing trigger log:', error)
        return {
          intensity: log.intensity ?? 0,
          emotion: log.emotion ?? 'Unknown',
          timeOfDay: 'Unknown',
        }
      }
    })
  }, [onboardingState?.triggerLogs]) 

  const recentActivity = useMemo(() => {
    try {
      return onboardingState?.triggerLogs?.slice(-3) ?? []
    } catch (error) {
      console.error('Error processing recent activity:', error)
      return []
    }
  }, [onboardingState?.triggerLogs]) 

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <>
      
      {panicOpen && (
        <PanicFlow
          isOpen={panicOpen}
          onClose={() => setPanicOpen(false)}
          behaviorLabel={onboardingState?.userSettings.behaviorLabel}
          whyDocument={onboardingState?.whyDocument.text}
          userId={user?.id}
        />
      )}
      
      {chatOpen && user && (
        <ChatOnboarding
          userId={user.id}
          onComplete={() => setChatOpen(false)}
          initialMode="replacement-prompts"
          onPanicClick={() => {
            setChatOpen(false)
            setPanicOpen(true)
          }}
        />
      )}
      
      {!panicOpen && !chatOpen && (
        <div className="dashboard-page chat-style">
          {sidebarOpen && (
            <div 
              className="sidebar-overlay" 
              onClick={() => setSidebarOpen(false)}
              onTouchStart={(e) => {
                e.preventDefault()
              }}
            />
          )}
          {!sidebarOpen && (
            <button className="chat-sidebar-toggle-mobile" type="button" aria-label="Expand sidebar" onClick={() => setSidebarOpen(true)}>
              <Image 
                src="/images/sidebar-open-arrow.png" 
                alt="Open sidebar"
                width={20}
                height={20}
                className="toggle-icon"
              />
            </button>
          )}
          <div className={`chat-layout ${sidebarOpen ? '' : 'collapsed'}`}>
            <aside className={`chat-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
              <div className="chat-logo-area">
                <div className="chat-logo-icon">
                  <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="16" stroke="#E39B63" strokeWidth="2" />
                    <circle cx="20" cy="20" r="8" fill="#E39B63" />
                    <path d="M20 4L22 12L20 8L18 12L20 4Z" fill="#E39B63" />
                    <path d="M20 36L22 28L20 32L18 28L20 36Z" fill="#E39B63" />
                    <path d="M4 20L12 22L8 20L12 18L4 20Z" fill="#E39B63" />
                    <path d="M36 20L28 22L32 20L28 18L36 20Z" fill="#E39B63" />
                  </svg>
                </div>
                {sidebarOpen && <div className="chat-logo-text">UrgeEase</div>}
                <button className="chat-sidebar-toggle" type="button" aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'} onClick={() => setSidebarOpen(!sidebarOpen)}>
                  <Image 
                    src={sidebarOpen ? '/images/sidebar-close.png' : '/images/sidebar-open-arrow.png'} 
                    alt={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                    width={20}
                    height={20}
                    className="toggle-icon"
                    onError={(e) => {
                      console.error('Failed to load sidebar toggle image')
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </button>
              </div>

              <div className="chat-section interactive">
                {sidebarOpen && <p className="chat-section-label">Core tools</p>}
                <button 
                  type="button" 
                  className={`chat-section-item ${!panicOpen && !chatOpen ? 'active' : ''}`}
                  onClick={() => setPanicOpen(true)}
                >
                  <span className="chat-section-item-icon">⚡</span>
                  {sidebarOpen && (
                    <>
                      Panic button
                      <span className="chat-section-item-meta">One tap emergency</span>
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  className="chat-section-item"
                  onClick={() => setChatOpen(true)}
                >
                  <span className="chat-section-item-icon">🤖</span>
                  {sidebarOpen && 'AI Recovery Partner'}
                </button>
                <button type="button" className="chat-section-item">
                  <span className="chat-section-item-icon">🌀</span>
                  {sidebarOpen && 'Defusion guidance'}
                </button>
                <button type="button" className="chat-section-item">
                  <span className="chat-section-item-icon">💨</span>
                  {sidebarOpen && 'Breathing exercises'}
                </button>
                <button type="button" className="chat-section-item">
                  <span className="chat-section-item-icon">📝</span>
                  {sidebarOpen && 'Trigger logging'}
                </button>
              <button type="button" className="chat-section-item">
                <span className="chat-section-item-icon">📊</span>
                {sidebarOpen && 'Insights dashboard'}
              </button>
              <button 
                type="button" 
                className="chat-section-item"
                onClick={() => router.push('/settings')}
              >
                <span className="chat-section-item-icon">⚙️</span>
                {sidebarOpen && 'Settings'}
              </button>
            </div>

            {sidebarOpen && (
              <>
                <div className="chat-separator" />

                  <div className="chat-account">
                    <span className="chat-account-label">Account</span>
                    <p className="chat-account-email">{user?.email || 'No email'}</p>
                    <button 
                      className="chat-account-btn btn-secondary" 
                      type="button"
                      onClick={async () => {
                        try {
                          await signOut()
                          router.push('/')
                        } catch (error) {
                          console.error('Failed to sign out:', error)
                          router.push('/')
                        }
                      }}
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </aside>
            <main className="chat-main">
              <PersonalizationBanner userId={user?.id} />
              
              {daysSinceOnboarding > 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  <p>You&apos;ve been using UrgeEase for {daysSinceOnboarding} day{daysSinceOnboarding !== 1 ? 's' : ''}</p>
                  {panicUses > 0 && (
                    <p>You&apos;ve used the panic button {panicUses} time{panicUses !== 1 ? 's' : ''}</p>
                  )}
                </div>
              )}
            </main>
          </div>
        </div>
      )}
    </>
  )
}


