'use client'

import Link from 'next/link'
import { cn } from '@/frontend/lib/utils'

// Renders the auth card container.
export function AuthCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'w-full max-w-md rounded-2xl p-8',
        'flex flex-col gap-6',
        'shadow-lg',
        className
      )}
      style={{
        backgroundColor: 'var(--color-card-bg)',
        border: '1px solid rgba(227, 155, 99, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
      }}
    >
      {children}
    </div>
  )
}

// Renders the auth page header.
export function AuthHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <header className="space-y-2 text-center">
      <Link
        href="/"
        className="inline-flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
        style={{ color: 'var(--color-text-muted)' }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-dark)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
      >
        <span 
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
          style={{
            border: '1px solid rgba(227, 155, 99, 0.3)',
            backgroundColor: 'rgba(227, 155, 99, 0.1)',
            color: 'var(--color-accent)',
          }}
        >
          UE
        </span>
        <span className="tracking-tight" style={{ fontFamily: 'var(--font-primary)' }}>UrgeEase</span>
      </Link>
      <div className="space-y-1">
        <p 
          className="text-xs font-medium uppercase tracking-[0.2em]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Private chat support
        </p>
        <h1 
          className="text-xl font-semibold tracking-tight"
          style={{ color: 'var(--color-text-dark)', fontFamily: 'var(--font-primary)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</p>
        )}
      </div>
    </header>
  )
}

// Renders auth footer links.
export function AuthFooterLinks({
  mode,
}: {
  mode: 'sign-in' | 'sign-up'
}) {
  return (
    <footer className="mt-2 space-y-2 text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
      {mode === 'sign-in' ? (
        <p>
          Don&apos;t have an account?{' '}
          <Link
            href="/auth/sign-up"
            className="font-medium underline-offset-4 hover:underline transition-colors"
            style={{ color: 'var(--color-accent)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent-dark)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-accent)'}
          >
            Get started
          </Link>
        </p>
      ) : (
        <p>
          Already have an account?{' '}
          <Link
            href="/auth/sign-in"
            className="font-medium underline-offset-4 hover:underline transition-colors"
            style={{ color: 'var(--color-accent)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent-dark)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-accent)'}
          >
            Sign in
          </Link>
        </p>
      )}
      <p className="text-[11px] leading-relaxed">
        By continuing, you agree that UrgeEase is{' '}
        <span className="font-medium">not a substitute</span> for professional
        mental health care. In an emergency, use local crisis resources.
      </p>
    </footer>
  )
}

