

import { ApiError } from './types'


// Hides part of an email address.
export function anonymizeEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return '***@***'
  }
  
  const [localPart, domain] = email.split('@')
  const visibleChars = Math.min(2, localPart.length)
  const anonymizedLocal = localPart.substring(0, visibleChars) + '***'
  
  return `${anonymizedLocal}@${domain}`
}


// Turns an error into a user-friendly message.
export function getUserFriendlyError(error: ApiError | Error | unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const apiError = error as ApiError
    const message = apiError.message || 'An error occurred'
    if (message.includes('timeout') || message.includes('Gateway') || apiError.status === 504) {
      return 'Server timeout. Please try again in a moment.'
    }
    
    if (message.includes('User already registered') || message.includes('already exists')) {
      return 'This email is already registered. Please sign in instead.'
    }
    
    if (message.includes('Database') || message.includes('database')) {
      return 'Database configuration error. Please contact support.'
    }
    
    if (message.includes('Invalid login credentials')) {
      return 'Invalid email or password.'
    }
    
    if (message.includes('Invalid') && (message.includes('email') || message.includes('password'))) {
      return 'Invalid email or password format. Please check your input.'
    }
    
    if (message.includes('network') || message.includes('Network') || message.includes('fetch')) {
      return 'Network error. Please check your internet connection and try again.'
    }
    
    return message
  }
  
  if (error instanceof Error) {
    return error.message || 'An unexpected error occurred'
  }
  
  return 'An unexpected error occurred. Please try again.'
}


// Logs an error with safe details.
export function logError(context: string, error: unknown, additionalData?: Record<string, unknown>) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined
  const sanitizedData: Record<string, unknown> = {}
  if (additionalData) {
    for (const [key, value] of Object.entries(additionalData)) {
      if (key.toLowerCase().includes('email') && typeof value === 'string' && value.includes('@')) {
        sanitizedData[key] = anonymizeEmail(value)
      } else {
        sanitizedData[key] = value
      }
    }
  }
  console.error(`[${context}]`, {
    message: errorMessage,
    stack: errorStack,
    ...sanitizedData,
    timestamp: new Date().toISOString(),
  })
}

