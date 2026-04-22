import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import AuthProviderWrapper from '@/components/AuthProvider'
import './base-styles.css'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://urgeease.com'),
  title: 'UrgeEase - Private, judgment-free support when urges hit',
  description:
    'UrgeEase is an offline recovery support tool for social media and pornography addiction, with chat support and results that help you understand triggers over time. Privacy-first and not a substitute for professional care.',
  openGraph: {
    title: 'UrgeEase - Private, judgment-free support when urges hit',
    description:
      'Offline chat support for social media and pornography addiction, with a results dashboard that surfaces triggers over time.',
    type: 'website',
    url: 'https://urgeease.com',
    siteName: 'UrgeEase',
  },
  twitter: {
    card: 'summary',
    title: 'UrgeEase - Private, judgment-free support when urges hit',
    description:
      'Chat support for social media and pornography addiction. Conversations stored locally by default.',
  },
  icons: {
    icon: '/images/favicon.svg',
  },
}

// Sets up the main page layout.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProviderWrapper>
          <div className="noise-overlay" />
          {children}
        </AuthProviderWrapper>
      </body>
    </html>
  )
}
