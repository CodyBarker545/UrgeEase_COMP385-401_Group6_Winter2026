'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthResponse } from '@supabase/supabase-js'
import { createClientSupabase } from '@/lib/supabase'
import { SignUpResponse, SignInResponse, normalizeAuthError, createTimeoutPromise, AUTH_TIMEOUT_MS } from '@/lib/types'
import { getUserFriendlyError, logError } from '@/lib/errors'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<SignUpResponse>
  signIn: (email: string, password: string) => Promise<SignInResponse>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provides auth state to the app.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const supabase = createClientSupabase()
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }).catch(() => {
        setLoading(false)
      })
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      })

      return () => subscription.unsubscribe()
    } catch (error) {
      logError('AuthContext.initialization', error)
      setLoading(false)
    }
  }, [])

  
  const signUp = async (email: string, password: string): Promise<SignUpResponse> => {
    try {
      const supabase = createClientSupabase()
      const signUpPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })
      const result = await Promise.race([
        signUpPromise,
        createTimeoutPromise(AUTH_TIMEOUT_MS)
      ]) as AuthResponse
      
      if (result.error) {
        const normalizedError = normalizeAuthError(result.error)
        const userFriendlyMessage = getUserFriendlyError(normalizedError)
        
        logError('AuthContext.signUp', result.error, { email })
        
        return {
          error: {
            ...normalizedError,
            message: userFriendlyMessage,
          },
        }
      }
      
      return {
        error: null,
        data: {
          user: result.data.user,
          session: result.data.session,
        },
      }
    } catch (error) {
      logError('AuthContext.signUp', error, { email })
      
      const normalizedError = normalizeAuthError(error)
      const userFriendlyMessage = getUserFriendlyError(normalizedError)
      
      return {
        error: {
          ...normalizedError,
          message: userFriendlyMessage,
        },
      }
    }
  }

  
  const signIn = async (email: string, password: string): Promise<SignInResponse> => {
    try {
      const supabase = createClientSupabase()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        const normalizedError = normalizeAuthError(error)
        const userFriendlyMessage = getUserFriendlyError(normalizedError)
        
        logError('AuthContext.signIn', error, { email })
        
        return {
          error: {
            ...normalizedError,
            message: userFriendlyMessage,
          },
        }
      }
      
      return { error: null }
    } catch (error) {
      logError('AuthContext.signIn', error, { email })
      
      const normalizedError = normalizeAuthError(error)
      const userFriendlyMessage = getUserFriendlyError(normalizedError)
      
      return {
        error: {
          ...normalizedError,
          message: userFriendlyMessage,
        },
      }
    }
  }

  
  const signOut = async (): Promise<void> => {
    try {
      const supabase = createClientSupabase()
      await supabase.auth.signOut()
    } catch (error) {
      logError('AuthContext.signOut', error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Returns the current auth context.
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

