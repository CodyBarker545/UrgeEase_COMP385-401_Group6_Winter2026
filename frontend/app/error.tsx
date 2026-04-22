'use client'

import { useEffect } from 'react'
import { logError } from '@/lib/errors'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

// Shows the error page and lets the user retry.
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    logError('ErrorBoundary', error, { 
      digest: error.digest,
      message: error.message,
      stack: error.stack 
    })
  }, [error])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      backgroundColor: '#F6F4EF'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ width: '80px', height: '80px', margin: '0 auto 24px' }}>
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
            <circle cx="32" cy="32" r="28" stroke="#E39B63" strokeWidth="3" />
            <path d="M32 20v16" stroke="#E39B63" strokeWidth="3" strokeLinecap="round" />
            <circle cx="32" cy="44" r="2" fill="#E39B63" />
          </svg>
        </div>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 600,
          color: '#242323',
          marginBottom: '12px'
        }}>Something went wrong</h2>
        <p style={{
          fontSize: '16px',
          color: '#666666',
          marginBottom: '24px',
          lineHeight: 1.6
        }}>
          We encountered an unexpected error. Don&apos;t worry—your data is safe.
        </p>
        <button 
          onClick={() => reset()} 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px 32px',
            backgroundColor: '#E39B63',
            color: '#242323',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#d88b53'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#E39B63'}
        >
          Try again
        </button>
      </div>
    </div>
  )
}

