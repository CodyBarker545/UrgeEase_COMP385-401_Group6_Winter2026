'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientSupabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'

interface PostPanicReEngagementProps {
  userId?: string
  onDismiss: () => void
}

// Shows the follow-up after panic support.
export default function PostPanicReEngagement({ userId, onDismiss }: PostPanicReEngagementProps) {
  const router = useRouter()
  const [showToast, setShowToast] = useState(false)
  const [hasShown, setHasShown] = useState(false)

  useEffect(() => {
    // Handles check and show.
    const checkAndShow = async () => {
      if (!userId || hasShown) return

      try {
        const supabase = createClientSupabase()
        const { data } = await supabase
          .from('users')
          .select('personalization_status, post_panic_toast_shown')
          .eq('id', userId)
          .single()

        if (data?.personalization_status === 'pending' && !data?.post_panic_toast_shown) {
          setShowToast(true)
          await supabase
            .from('users')
            .update({ post_panic_toast_shown: true })
            .eq('id', userId)
        }
      } catch (error) {
        console.error('Error checking re-engagement status:', error)
      }
    }
    const timer = setTimeout(() => {
      checkAndShow()
    }, 2000)

    return () => clearTimeout(timer)
  }, [userId, hasShown])

  // Starts a follow-up chat.
  const handleStartChat = () => {
    setShowToast(false)
    setHasShown(true)
    router.push('/chat-onboarding')
  }

  // Dismisses the follow-up prompt.
  const handleDismiss = () => {
    setShowToast(false)
    setHasShown(true)
    onDismiss()
  }

  return (
    <AnimatePresence>
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[3000] max-w-md w-[calc(100%-2rem)]"
        >
          <div className="bg-white rounded-xl shadow-2xl p-5 border border-gray-200">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">That was a tough urge</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Want to chat for 60 seconds to make the next session even more effective?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleStartChat}
                    className="px-4 py-2 bg-[#4AB3B3] text-white rounded-lg text-sm font-semibold hover:bg-[#3A9A9A] transition-colors"
                  >
                    Start Chat
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

