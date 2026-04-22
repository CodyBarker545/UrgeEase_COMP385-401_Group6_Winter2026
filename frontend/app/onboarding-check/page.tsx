'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/frontend/contexts/AuthContext'
import { createClientSupabase } from '@/frontend/lib/supabase'
import OnboardingOptIn from '@/frontend/components/OnboardingOptIn'

// Handles onboarding check page.
export default function OnboardingCheckPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [personalizationStatus, setPersonalizationStatus] = useState<string | null>(null)

  useEffect(() => {
    // Handles check personalization.
    const checkPersonalization = async () => {
      if (!user) {
        router.push('/login')
        return
      }

      try {
        const supabase = createClientSupabase()
        const { data, error } = await supabase
          .from('users')
          .select('personalization_status')
          .eq('id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking personalization:', error)
        }

        const status = data?.personalization_status || 'pending'
        setPersonalizationStatus(status)

        if (status === 'completed') {
          router.push('/dashboard')
        } else {
          setChecking(false)
        }
      } catch (error) {
        console.error('Error:', error)
        setChecking(false)
      }
    }

    if (!loading && user) {
      checkPersonalization()
    } else if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <OnboardingOptIn userId={user.id} />
}

