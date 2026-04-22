import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { z } from 'zod'
import { createServerClient } from '@/frontend/lib/supabase'
import { logError, anonymizeEmail } from '@/frontend/lib/errors'
const signupSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .max(254, 'Email address is too long')
    .email('Please enter a valid email address')
    .transform((val) => val.trim().toLowerCase()),
  website: z.string().optional(), 
  timestamp: z.number().positive().optional(), 
})

type SignupRequest = z.infer<typeof signupSchema>
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 5 
const RATE_WINDOW = 60 * 1000 
let requestCount = 0
const CLEANUP_INTERVAL = 100 


// Removes old rate limit entries.
function cleanupExpiredEntries(now: number): void {
  const keysToDelete: string[] = []
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      keysToDelete.push(key)
    }
  }
  keysToDelete.forEach(key => rateLimitMap.delete(key))
}

// Checks whether an IP can submit the form.
function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  requestCount++
  if (requestCount % CLEANUP_INTERVAL === 0 || rateLimitMap.size > 1000) {
    cleanupExpiredEntries(now)
  }

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW })
    return { allowed: true, remaining: RATE_LIMIT - 1 }
  }

  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  return { allowed: true, remaining: RATE_LIMIT - record.count }
}

// Gets the best client IP from request headers.
function getClientIP(headersList: Headers): string {
  const vercelForwarded = headersList.get('x-vercel-forwarded-for')
  if (vercelForwarded) {
    return vercelForwarded.split(',')[0]?.trim() || 'unknown'
  }
  const forwardedFor = headersList.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown'
  }
  return headersList.get('x-real-ip') || 'unknown'
}

// Handles the POST request for this route.
export async function POST(request: Request) {
  try {
    const headersList = headers()
    const ip = getClientIP(headersList)
    const { allowed, remaining } = checkRateLimit(ip)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60'
          }
        }
      )
    }
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > 1024) { 
      return NextResponse.json(
        { error: 'Request body too large' },
        { status: 413, headers: { 'X-RateLimit-Remaining': remaining.toString() } }
      )
    }
    let body: SignupRequest
    try {
      const rawBody = await request.json()
      body = signupSchema.parse(rawBody)
    } catch (err) {
      if (err instanceof z.ZodError) {
        const firstError = err.issues[0]
        return NextResponse.json(
          { error: firstError.message },
          { status: 400, headers: { 'X-RateLimit-Remaining': remaining.toString() } }
        )
      }
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: { 'X-RateLimit-Remaining': remaining.toString() } }
      )
    }
    
    const { email, website, timestamp } = body
    if (website) {
      logError('beta-signup.honeypot', new Error('Honeypot field filled'), { ip, timestamp })
      return NextResponse.json(
        { message: "You're on the list! We'll notify you when we launch." },
        { status: 201 }
      )
    }
    if (timestamp !== undefined && timestamp < 1000) {
      logError('beta-signup.suspicious-timing', new Error('Form submitted too quickly'), { 
        ip, 
        timestamp,
        email: email 
      })
      return NextResponse.json(
        { message: "You're on the list! We'll notify you when we launch." },
        { status: 201 }
      )
    }
    let supabase
    try {
      supabase = createServerClient()
    } catch (error) {
      logError('beta-signup.createServerClient', error)
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    const { error } = await supabase
      .from('beta_signups')
      .insert([
        {
          email,
          source: 'landing_page'
        }
      ])

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { message: "You're already on the list! We'll be in touch soon." },
          { status: 200, headers: { 'X-RateLimit-Remaining': remaining.toString() } }
        )
      }

      logError('beta-signup.insert', error, { email, errorCode: error.code })
      return NextResponse.json(
        { error: 'Failed to save signup. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: "You're on the list! We'll notify you when we launch." },
      { status: 201, headers: { 'X-RateLimit-Remaining': remaining.toString() } }
    )
  } catch (err) {
    logError('beta-signup.handler', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}


