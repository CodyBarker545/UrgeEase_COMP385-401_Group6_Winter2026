'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore, useOnboardingStore } from '@/frontend/lib/store'
import { AppShell } from '@/frontend/components/app/AppShell'

// Handles app layout.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const token = useAuthStore((state) => state.token)
  const onboardingData = useOnboardingStore((state) => state.onboardingData)

  useEffect(() => {
    if (!pathname.startsWith('/app')) {
      return
    }
    if (!token && !pathname.startsWith('/auth')) {
      router.push('/auth/sign-in')
      return
    }
    if (
      token &&
      !onboardingData.completed &&
      pathname !== '/app/onboarding' &&
      !pathname.startsWith('/auth')
    ) {
      router.push('/app/onboarding')
    }
  }, [token, onboardingData.completed, pathname, router])
  if (!pathname.startsWith('/app') || pathname.startsWith('/auth') || !token) {
    return <>{children}</>
  }

  return <AppShell>{children}</AppShell>
}


