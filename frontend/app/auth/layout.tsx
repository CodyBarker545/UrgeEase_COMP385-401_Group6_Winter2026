import type { ReactNode } from 'react'

// Handles auth layout.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-page flex min-h-screen items-center justify-center px-4 py-16" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="w-full max-w-5xl">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 md:flex-row md:items-start md:justify-between">
          <section className="hidden max-w-sm flex-1 text-sm md:block" style={{ color: 'var(--color-text-muted)' }}>
            <h2 className="mb-3 text-base font-semibold" style={{ color: 'var(--color-text-dark)' }}>
              Why we ask you to sign in
            </h2>
            <ul className="space-y-2">
              <li>• Keep your chat and voice history tied to one private space.</li>
              <li>• Unlock results after 3–5 sessions so you can see patterns.</li>
              <li>• Prepare for optional, future cloud sync with explicit consent.</li>
            </ul>
          </section>
          <section className="flex-1 max-w-md w-full">{children}</section>
        </div>
      </div>
    </div>
  )
}

