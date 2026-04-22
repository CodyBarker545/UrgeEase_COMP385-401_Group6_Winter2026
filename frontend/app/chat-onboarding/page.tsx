'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/frontend/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { createClientSupabase } from '@/frontend/lib/supabase'
import ChatOnboarding from '@/frontend/components/ChatOnboarding'

// Handles chat onboarding page.
export default function ChatOnboardingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <ChatOnboarding userId={user.id} onComplete={() => router.push('/dashboard')} />
}
