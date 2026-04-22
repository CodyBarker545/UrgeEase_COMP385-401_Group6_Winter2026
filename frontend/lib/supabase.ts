import { createClient } from '@supabase/supabase-js'
import { getSupabaseUrl, getSupabaseAnonKey, getSupabaseServiceKey } from './env'


// Creates a Supabase server client.
export function createServerClient() {
  const supabaseUrl = getSupabaseUrl()
  const supabaseServiceKey = getSupabaseServiceKey()
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}


// Creates a Supabase browser client.
export function createClientSupabase() {
  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  })
}
export interface BetaSignup {
  id: string
  email: string
  created_at: string
  source: string
}

