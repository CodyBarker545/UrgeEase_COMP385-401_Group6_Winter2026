'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageSquare, Mic, BarChart3, History, Settings, AlertCircle, Menu, X, UserCircle, ClipboardList, ListChecks } from 'lucide-react'
import { useAuthStore } from '@/frontend/lib/store'
import { cn } from '@/frontend/lib/utils'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = [
    { href: '/app/home', label: 'Home', icon: Home },
    { href: '/app/assessment', label: 'Assessment', icon: ClipboardList },
    { href: '/app/plan', label: 'Plan', icon: ListChecks },
    { href: '/app/sessions', label: 'Sessions', icon: MessageSquare },
    { href: '/app/results', label: 'Results', icon: BarChart3 },
    { href: '/app/history', label: 'History', icon: History },
    { href: '/app/settings', label: 'Settings', icon: Settings },
  ]

  const isActive = (href: string) => {
    if (href === '/app/home') return pathname === '/app/home' || pathname === '/app'
    return pathname.startsWith(href)
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      
      <aside
        className="hidden md:flex md:flex-col md:w-64 md:border-r"
        style={{
          backgroundColor: 'var(--color-card-bg)',
          borderColor: 'rgba(227, 155, 99, 0.2)',
        }}
      >
        <div className="flex h-16 items-center gap-3 border-b px-6" style={{ borderColor: 'rgba(227, 155, 99, 0.2)' }}>
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold"
            style={{
              border: '1px solid rgba(227, 155, 99, 0.3)',
              backgroundColor: 'rgba(227, 155, 99, 0.1)',
              color: 'var(--color-accent)',
            }}
          >
            UE
          </div>
          <span className="font-semibold tracking-tight" style={{ color: 'var(--color-text-dark)', fontFamily: 'var(--font-primary)' }}>
            UrgeEase
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'font-semibold'
                    : 'hover:bg-opacity-50'
                )}
                style={{
                  backgroundColor: active ? 'rgba(227, 155, 99, 0.15)' : 'transparent',
                  color: active ? 'var(--color-accent)' : 'var(--color-text-dark)',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = 'rgba(227, 155, 99, 0.08)'
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t p-4" style={{ borderColor: 'rgba(227, 155, 99, 0.2)' }}>
          <Link
            href="/app/crisis"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            style={{ color: '#dc2626' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <AlertCircle className="h-5 w-5" />
            Crisis Resources
          </Link>
          {user && (
            <Link
              href="/app/profile"
              className="mt-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
              style={{ color: 'var(--color-text-dark)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(227, 155, 99, 0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <UserCircle className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
              <div className="min-w-0">
                <p className="truncate text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {user.email}
                </p>
                <p className="text-xs font-medium">Profile &amp; Analytics</p>
              </div>
            </Link>
          )}
        </div>
      </aside>

      
      <div className="flex w-full flex-col md:hidden">
        <header
          className="flex h-14 items-center justify-between border-b px-4"
          style={{
            backgroundColor: 'var(--color-card-bg)',
            borderColor: 'rgba(227, 155, 99, 0.2)',
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X className="h-6 w-6" style={{ color: 'var(--color-text-dark)' }} /> : <Menu className="h-6 w-6" style={{ color: 'var(--color-text-dark)' }} />}
          </button>
          <span className="font-semibold" style={{ color: 'var(--color-text-dark)', fontFamily: 'var(--font-primary)' }}>
            UrgeEase
          </span>
          <Link href="/app/crisis" className="p-2">
            <AlertCircle className="h-6 w-6" style={{ color: '#dc2626' }} />
          </Link>
        </header>

        
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black bg-opacity-50"
              onClick={() => setSidebarOpen(false)}
            />
            <aside
              className="fixed left-0 top-0 z-50 h-full w-64"
              style={{ backgroundColor: 'var(--color-card-bg)' }}
            >
              <div className="flex h-14 items-center justify-between border-b px-4" style={{ borderColor: 'rgba(227, 155, 99, 0.2)' }}>
                <span className="font-semibold" style={{ color: 'var(--color-text-dark)' }}>Menu</span>
                <button onClick={() => setSidebarOpen(false)} className="p-2">
                  <X className="h-6 w-6" style={{ color: 'var(--color-text-dark)' }} />
                </button>
              </div>
              <nav className="space-y-1 p-4">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                        active && 'font-semibold'
                      )}
                      style={{
                        backgroundColor: active ? 'rgba(227, 155, 99, 0.15)' : 'transparent',
                        color: active ? 'var(--color-accent)' : 'var(--color-text-dark)',
                      }}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </aside>
          </>
        )}
      </div>

      
      <main className="flex-1">
        
        {(pathname.includes('/app/session/chat') || pathname.includes('/app/session/voice')) && (
          <div
            className="flex h-14 items-center justify-between border-b px-4 md:px-6"
            style={{
              backgroundColor: 'var(--color-card-bg)',
              borderColor: 'rgba(227, 155, 99, 0.2)',
            }}
          >
            <div className="flex items-center gap-3">
              {pathname.includes('/app/session/chat') ? (
                <Link
                  href={pathname.replace('/chat', '/voice')}
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: 'rgba(227, 155, 99, 0.1)',
                    color: 'var(--color-accent)',
                  }}
                >
                  <Mic className="h-4 w-4" />
                  Switch to Voice
                </Link>
              ) : (
                <Link
                  href={pathname.replace('/voice', '/chat')}
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: 'rgba(227, 155, 99, 0.1)',
                    color: 'var(--color-accent)',
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                  Switch to Chat
                </Link>
              )}
            </div>
          </div>
        )}

        <div className="p-4 md:p-8">{children}</div>
      </main>

      
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t md:hidden"
        style={{
          backgroundColor: 'var(--color-card-bg)',
          borderColor: 'rgba(227, 155, 99, 0.2)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 py-2 px-3"
              style={{
                color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
              }}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      
      <div className="h-16 md:hidden" />
    </div>
  )
}

