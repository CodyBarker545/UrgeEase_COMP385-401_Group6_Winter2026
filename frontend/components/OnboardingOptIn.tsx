'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClientSupabase } from '@/lib/supabase'

interface OnboardingOptInProps {
  userId: string
}

// Shows the onboarding opt-in card.
export default function OnboardingOptIn({ userId }: OnboardingOptInProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Handles handle setup.
  const handleSetup = async () => {
    setLoading(true)
    try {
      const supabase = createClientSupabase()
      await supabase
        .from('users')
        .update({ personalization_status: 'pending' })
        .eq('id', userId)
      router.push('/chat-onboarding')
    } catch (error) {
      console.error('Error:', error)
      router.push('/chat-onboarding')
    } finally {
      setLoading(false)
    }
  }

  // Handles handle skip.
  const handleSkip = async () => {
    setLoading(true)
    try {
      const supabase = createClientSupabase()
      await supabase
        .from('users')
        .update({ personalization_status: 'pending' })
        .eq('id', userId)
      router.push('/dashboard')
    } catch (error) {
      console.error('Error:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#F0F9F9] to-white px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
      >
        <div className="mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#4AB3B3] to-[#E39B63] rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Welcome to UrgeEase
          </h1>
          <p className="text-gray-600 text-[15px] leading-relaxed">
            Let's personalize your recovery experience. I'll ask you a few quick questions to set up your AI Recovery Partner.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleSetup}
            disabled={loading}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-[#4AB3B3] to-[#7FD4D4] text-white rounded-full font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Setting up...' : 'Setup your AI Recovery Partner'}
          </button>
          <button
            onClick={handleSkip}
            disabled={loading}
            className="w-full py-3.5 px-6 bg-white border-2 border-gray-200 text-gray-700 rounded-full font-semibold hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Go to Dashboard
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          You can always set this up later from your dashboard
        </p>
      </motion.div>
    </div>
  )
}
