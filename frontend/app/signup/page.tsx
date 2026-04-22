'use client'

import { redirect } from 'next/navigation'

// Handles legacy sign up page.
export default function LegacySignUpPage() {
  redirect('/auth/sign-up')
}
