'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { verifyEmail } from '@/frontend/lib/api'
import { useAuthStore } from '@/frontend/lib/store'
import { AuthCard, AuthHeader, AuthFooterLinks } from '@/frontend/components/auth/AuthCard'
import { Input } from '@/frontend/components/ui/input'
import { Label } from '@/frontend/components/ui/label'

const verifySchema = z.object({
  code: z.string().min(1, 'Verification code is required').refine(
    (val) => val.length === 6,
    { message: 'Verification code must be exactly 6 digits' }
  ),
})

type VerifyValues = z.infer<typeof verifySchema>

// Shows and handles email verification.
export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const login = useAuthStore((state) => state.login)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
  } = useForm<VerifyValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { code: '' },
  })

  useEffect(() => {
    if (!email) {
      router.push('/auth/sign-up')
    }
  }, [email, router])

  // Handles on submit.
  const onSubmit = async (values: VerifyValues) => {
    if (!values.code || values.code.length !== 6) {
      setError('code', {
        message: 'Please enter a 6-digit verification code',
      })
      return
    }

    const result = await verifyEmail({ email, code: values.code })
    if (!result.ok || !result.token || !result.user) {
      setError('code', {
        message: result.error || 'Invalid verification code. Please try again.',
      })
      return
    }

    login(result.token, result.user)
    router.replace('/app/onboarding')
  }

  if (!email) {
    return null
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Verify your email"
        subtitle={`We sent a 6-digit code to ${email}. Enter it below.`}
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="123456"
            {...register('code', {
              onChange: (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '')
              },
            })}
            aria-invalid={!!errors.code}
            className="text-center text-2xl tracking-widest"
          />
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            For demo, use code: <strong>123456</strong>
          </p>
          <button
            type="button"
            onClick={() => setValue('code', '123456')}
            className="mt-1 text-xs underline"
            style={{ color: 'var(--color-accent)' }}
          >
            Click to fill demo code
          </button>
          {errors.code && (
            <p className="text-xs" role="alert" style={{ color: '#dc2626' }}>
              {errors.code.message}
            </p>
          )}
        </div>
        <button
          type="submit"
          className="w-full rounded-full px-6 py-3 text-sm font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-text-light)',
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) e.currentTarget.style.backgroundColor = 'var(--color-accent-dark)'
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting) e.currentTarget.style.backgroundColor = 'var(--color-accent)'
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Verifying…' : 'Verify email'}
        </button>
      </form>
      <AuthFooterLinks mode="sign-in" />
    </AuthCard>
  )
}

