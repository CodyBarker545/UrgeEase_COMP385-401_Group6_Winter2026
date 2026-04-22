'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientSupabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'

interface PersonalizationBannerProps {
  userId?: string
}

// Shows a banner when personalization is available.
export default function PersonalizationBanner({ userId }: PersonalizationBannerProps) {
  const router = useRouter()
  const [showBanner, setShowBanner] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Handles check status.
    const checkStatus = async () => {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        const supabase = createClientSupabase()
        const { data } = await supabase
          .from('users')
          .select('personalization_status')
          .eq('id', userId)
          .single()

        if (data?.personalization_status === 'pending') {
          setShowBanner(true)
        }
      } catch (error) {
        console.error('Error checking personalization status:', error)
      } finally {
        setLoading(false)
      }
    }

    checkStatus()
  }, [userId])

  if (loading || !showBanner) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-6"
      >
        <div className="bg-gradient-to-r from-[#4AB3B3] to-[#7FD4D4] rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">Your Partner is ready</h3>
              <p className="text-sm opacity-90">
                Personalize your experience to make the Panic Button even more effective.
              </p>
            </div>
            <button
              onClick={() => router.push('/chat-onboarding')}
              className="ml-4 px-6 py-2.5 bg-white text-[#4AB3B3] rounded-full font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              Start Chat
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
