import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logError } from '@/frontend/lib/errors'
import { getSupabaseUrl, getSupabaseAnonKey } from '@/frontend/lib/env'


// Handles the GET request for this route.
export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') || '/onboarding-check'

    if (code) {
      try {
        const supabaseUrl = getSupabaseUrl()
        const supabaseAnonKey = getSupabaseAnonKey()
        
        const supabase = createClient(supabaseUrl, supabaseAnonKey)
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (!error) {
          const redirectUrl = new URL(next, requestUrl.origin)
          return NextResponse.redirect(redirectUrl)
        }
        
        logError('auth-callback.exchangeCode', error, { code: code.substring(0, 10) + '...' })
      } catch (err) {
        logError('auth-callback.handler', err)
      }
    }
    const errorUrl = new URL('/login?error=Could not verify email', requestUrl.origin)
    return NextResponse.redirect(errorUrl)
  } catch (err) {
    logError('auth-callback.outer', err)
    try {
      const requestUrl = new URL(request.url)
      const errorUrl = new URL('/login?error=Could not verify email', requestUrl.origin)
      return NextResponse.redirect(errorUrl)
    } catch {
      return NextResponse.redirect(new URL('/login?error=Could not verify email', 'https://urgeease.com'))
    }
  }
}

