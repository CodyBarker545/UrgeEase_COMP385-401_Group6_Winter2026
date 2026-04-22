'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { signUp as apiSignUp } from '@/frontend/lib/api'
import { AuthCard, AuthHeader, AuthFooterLinks } from '@/frontend/components/auth/AuthCard'
import { Input } from '@/frontend/components/ui/input'
import { PasswordInput } from '@/frontend/components/ui/password-input'
import { Label } from '@/frontend/components/ui/label'

const signUpSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Please add a first name or nickname')
      .max(50, 'Name is a bit too long'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type SignUpValues = z.infer<typeof signUpSchema>

export default function SignUpPage() {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: SignUpValues) => {
    const result = await apiSignUp({
      name: values.name,
      email: values.email,
      password: values.password,
    })
    if (!result.ok) {
      setError('root', {
        message: result.error || 'Unable to create your account. Please try again.',
      })
      return
    }

    router.push(`/auth/verify?email=${encodeURIComponent(values.email)}`)
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Create your UrgeEase account"
        subtitle="Three steps: account, email verification, start chat support."
      />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="name">Preferred name</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="What should UrgeEase call you?"
            {...register('name')}
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-xs" role="alert" style={{ color: '#dc2626' }}>
              {errors.name.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-xs" role="alert" style={{ color: '#dc2626' }}>
              {errors.email.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            {...register('password')}
            aria-invalid={!!errors.password}
          />
          {errors.password && (
            <p className="text-xs" role="alert" style={{ color: '#dc2626' }}>
              {errors.password.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            {...register('confirmPassword')}
            aria-invalid={!!errors.confirmPassword}
          />
          {errors.confirmPassword && (
            <p className="text-xs" role="alert" style={{ color: '#dc2626' }}>
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
        {errors.root && (
          <div
            className="rounded-md px-3 py-2 text-xs"
            role="alert"
            style={{
              border: '1px solid rgba(220, 38, 38, 0.4)',
              backgroundColor: 'rgba(220, 38, 38, 0.05)',
              color: '#dc2626',
            }}
          >
            {errors.root.message}
          </div>
        )}
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
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <AuthFooterLinks mode="sign-up" />
    </AuthCard>
  )
}

