'use client'

import { useState, FormEvent } from 'react'

// Shows and submits the beta signup form.
export default function BetaSignupForm() {
  const [email, setEmail] = useState('')
  const [honeypot, setHoneypot] = useState('') 
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [formStartTime] = useState(() => Date.now()) 

  // Submits the form data.
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    if (!email) {
      setStatus('error')
      setMessage('Please enter your email address')
      return
    }

    setStatus('loading')
    setMessage('')
    const timeToSubmit = Date.now() - formStartTime

    try {
      const response = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          website: honeypot, 
          timestamp: timeToSubmit 
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(data.message || "You're on the list! We'll be in touch soon.")
        setEmail('')
      } else if (response.status === 429) {
        setStatus('error')
        setMessage('Too many attempts. Please wait a minute and try again.')
      } else {
        setStatus('error')
        setMessage(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="beta-signup-form">
      
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        style={{ 
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          opacity: 0,
          pointerEvents: 'none'
        }}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        disabled={status === 'loading'}
        aria-label="Email address"
      />
      <button
        type="submit"
        className="btn-primary btn-large"
        disabled={status === 'loading'}
      >
        {status === 'loading' ? (
          <>
            <span className="spinner" />
            Joining...
          </>
        ) : (
          'Get Early Access'
        )}
      </button>
      
      {message && (
        <div className={`form-message ${status}`}>
          {message}
        </div>
      )}
    </form>
  )
}


