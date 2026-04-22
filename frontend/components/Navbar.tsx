'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

// Shows the main navigation bar.
export default function Navbar() {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  useEffect(() => {
    // Closes the menu when clicking outside it.
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  // Handles handle sign out.
  const handleSignOut = async () => {
    await signOut()
    setIsMobileMenuOpen(false)
    router.push('/')
  }

  // Opens or closes the mobile menu.
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Closes the mobile menu.
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="header">
      <nav className="nav-container" ref={navRef}>
        <Link href="/" className="logo" onClick={closeMobileMenu}>
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="16" stroke="#E39B63" strokeWidth="2" />
            <circle cx="20" cy="20" r="8" fill="#E39B63" />
            <path d="M20 4L22 12L20 8L18 12L20 4Z" fill="#E39B63" />
            <path d="M20 36L22 28L20 32L18 28L20 36Z" fill="#E39B63" />
            <path d="M4 20L12 22L8 20L12 18L4 20Z" fill="#E39B63" />
            <path d="M36 20L28 22L32 20L28 18L36 20Z" fill="#E39B63" />
          </svg>
          <span className="nav-brand-outline">UrgeEase</span>
        </Link>
        <div className={`nav-right ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          {loading ? (
            <div className="nav-loading">Loading...</div>
          ) : user ? (
            <>
              <Link href="/dashboard" className="btn-primary nav-btn" onClick={closeMobileMenu}>
                Dashboard
              </Link>
              <button onClick={handleSignOut} className="btn-secondary nav-btn">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/#how-it-works" className="nav-link-btn" onClick={closeMobileMenu}>
                How it works
              </Link>
              <Link href="/privacy" className="nav-link-btn" onClick={closeMobileMenu}>
                Privacy
              </Link>
              <Link href="/auth/sign-in" className="btn-secondary nav-btn" onClick={closeMobileMenu}>
                Sign in
              </Link>
              <Link href="/auth/sign-up" className="btn-primary nav-btn" onClick={closeMobileMenu}>
                Get started
              </Link>
            </>
          )}
        </div>
        <button 
          className="hamburger-menu"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span style={{ 
            transform: isMobileMenuOpen ? 'rotate(45deg) translateY(7px)' : 'none',
            transition: 'all 0.3s ease'
          }} />
          <span style={{ 
            opacity: isMobileMenuOpen ? 0 : 1,
            transition: 'opacity 0.3s ease'
          }} />
          <span style={{ 
            transform: isMobileMenuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none',
            transition: 'all 0.3s ease'
          }} />
        </button>
      </nav>
    </header>
  )
}

