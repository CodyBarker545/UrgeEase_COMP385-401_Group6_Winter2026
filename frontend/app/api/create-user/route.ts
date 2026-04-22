import { NextResponse } from 'next/server'
import { createServerClient } from '@/frontend/lib/supabase'
import { logError } from '@/frontend/lib/errors'


// Handles the POST request for this route.
export async function POST(request: Request) {
  try {
    let body
    try {
      body = await request.json()
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { userId, email } = body

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    if (typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    const { error } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          email: email,
          created_at: new Date().toISOString(),
        }
      ])

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { message: 'User profile already exists' },
          { status: 200 }
        )
      }

      logError('create-user.insert', error, { userId, email })
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'User profile created successfully' },
      { status: 201 }
    )
  } catch (err) {
    logError('create-user.handler', err)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

