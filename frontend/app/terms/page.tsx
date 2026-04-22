import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service - UrgeEase',
  description: 'UrgeEase terms of service and usage agreement.',
}

// Handles terms page.
export default function TermsPage() {
  return (
    <main className="container" style={{ paddingTop: '120px', paddingBottom: '80px', maxWidth: '800px' }}>
      <Link href="/" className="btn-primary" style={{ marginBottom: '32px', display: 'inline-block' }}>
        ← Back to Home
      </Link>
      
      <h1 style={{ fontSize: '40px', marginBottom: '24px', color: 'var(--color-text-dark)' }}>
        Terms of Service
      </h1>
      
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px' }}>
        Last updated: January 2026
      </p>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', color: 'var(--color-text-dark)' }}>
          Acceptance of Terms
        </h2>
        <p style={{ lineHeight: '1.7', color: 'var(--color-text-muted)' }}>
          By accessing or using UrgeEase, you agree to be bound by these Terms of Service. 
          If you do not agree to these terms, please do not use our service.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', color: 'var(--color-text-dark)' }}>
          Description of Service
        </h2>
        <p style={{ lineHeight: '1.7', color: 'var(--color-text-muted)' }}>
          UrgeEase is a digital wellness tool designed to help users manage urges and compulsive behaviors 
          through evidence-based techniques. The service is not a substitute for professional medical or 
          mental health treatment.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', color: 'var(--color-text-dark)' }}>
          User Responsibilities
        </h2>
        <ul style={{ lineHeight: '1.7', color: 'var(--color-text-muted)', paddingLeft: '24px' }}>
          <li style={{ marginBottom: '8px' }}>You must be at least 18 years old to use this service</li>
          <li style={{ marginBottom: '8px' }}>You are responsible for maintaining the security of your account</li>
          <li style={{ marginBottom: '8px' }}>You agree not to misuse the service or help anyone else do so</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', color: 'var(--color-text-dark)' }}>
          Disclaimer
        </h2>
        <p style={{ lineHeight: '1.7', color: 'var(--color-text-muted)' }}>
          UrgeEase is provided &quot;as is&quot; without warranties of any kind. We do not guarantee that the 
          service will meet your specific needs or that it will be uninterrupted or error-free.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', color: 'var(--color-text-dark)' }}>
          Contact
        </h2>
        <p style={{ lineHeight: '1.7', color: 'var(--color-text-muted)' }}>
          Questions about these terms? Contact us at{' '}
          <a href="mailto:hello@urgeease.com" style={{ color: 'var(--color-accent)' }}>
            hello@urgeease.com
          </a>
        </p>
      </section>
    </main>
  )
}
