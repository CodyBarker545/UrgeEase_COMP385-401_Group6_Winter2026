'use client'

import { useEffect } from 'react'
import { redirect, useSearchParams } from 'next/navigation'

// Handles legacy login page.
export default function LegacyLoginPage() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const message = searchParams.get('message')
    const email = searchParams.get('email')
    const params = new URLSearchParams()
    if (message) params.set('message', message)
    if (email) params.set('email', email)
    const suffix = params.toString() ? `?${params.toString()}` : ''
    redirect(`/auth/sign-in${suffix}`)
  }, [searchParams])

  return null
}
