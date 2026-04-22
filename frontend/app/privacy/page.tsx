import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy - UrgeEase',
  description: 'UrgeEase privacy policy. Learn how we protect your data.',
}

// Handles privacy page.
export default function PrivacyPage() {
  return (
    <main className="container" style={{ paddingTop: '120px', paddingBottom: '80px', maxWidth: '800px' }}>
      <Link href="/" className="btn-primary" style={{ marginBottom: '32px', display: 'inline-block' }}>
        ← Back to Home
      </Link>
      
      <h1 style={{ fontSize: '40px', marginBottom: '24px', color: 'var(--color-text-dark)' }}>
        Privacy Policy
      </h1>
      
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px' }}>
        Last updated: January 2026
      </p>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', color: 'var(--color-text-dark)' }}>
          Our Commitment to Privacy
        </h2>
        <p style={{ lineHeight: '1.7', color: 'var(--color-text-muted)' }}>
          UrgeEase is built with privacy at its core. We believe your personal struggles should remain private, 
          and we&apos;ve designed our entire system around this principle.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', color: 'var(--color-text-dark)' }}>
          Data We Collect
        </h2>
        <ul style={{ lineHeight: '1.7', color: 'var(--color-text-muted)', paddingLeft: '24px' }}>
          <li style={{ marginBottom: '8px' }}><strong>Email address</strong> - Only if you sign up for our beta waitlist</li>
          <li style={{ marginBottom: '8px' }}><strong>Usage data</strong> - Anonymous, aggregated statistics to improve the app</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', color: 'var(--color-text-dark)' }}>
          What We Don&apos;t Do
        </h2>
        <ul style={{ lineHeight: '1.7', color: 'var(--color-text-muted)', paddingLeft: '24px' }}>
          <li style={{ marginBottom: '8px' }}>We never sell your data</li>
          <li style={{ marginBottom: '8px' }}>We never show you ads</li>
          <li style={{ marginBottom: '8px' }}>We never share your information with third parties for marketing</li>
          <li style={{ marginBottom: '8px' }}>We never track your behavior outside of the app</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', color: 'var(--color-text-dark)' }}>
          Contact
        </h2>
        <p style={{ lineHeight: '1.7', color: 'var(--color-text-muted)' }}>
          Questions about privacy? Contact us at{' '}
          <a href="mailto:hello@urgeease.com" style={{ color: 'var(--color-accent)' }}>
            hello@urgeease.com
          </a>
        </p>
      </section>
    </main>
  )
}
