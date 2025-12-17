import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

import { Toaster } from '@/components/ui/toaster'
import { Toaster as SonnerToaster } from 'sonner'
import { QueryProvider } from '@/components/providers/query-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { AnalyticsProvider } from '@/components/providers/analytics-provider'
import { CookieBanner } from '@/components/ui/cookie-banner'

import './globals.css'

// Export Web Vitals reporting function
export { reportWebVitals } from '@/lib/monitoring/performance'

const inter = Inter({ subsets: ['latin'] })

/**
 * Viewport configuration for mobile responsiveness
 * - width: device-width ensures proper scaling on mobile devices
 * - initialScale: 1 starts at 100% zoom
 * - maximumScale: 5 allows users to zoom up to 5x (accessibility)
 * - userScalable: true allows pinch-to-zoom (WCAG requirement)
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export const metadata: Metadata = {
  title: {
    default: 'Mandarin SRS - Learn Chinese Pinyin',
    template: '%s | Mandarin SRS',
  },
  description:
    'Master Mandarin Chinese pinyin with spaced repetition. Type pinyin to learn characters efficiently.',
  keywords: [
    'Mandarin',
    'Chinese',
    'Pinyin',
    'SRS',
    'Spaced Repetition',
    'Language Learning',
    'Characters',
    'Typing',
  ],
  authors: [{ name: 'Your Name' }],
  creator: 'Your Name',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://your-domain.com',
    title: 'Mandarin SRS - Learn Chinese Pinyin',
    description: 'Master Mandarin Chinese pinyin with spaced repetition',
    siteName: 'Mandarin SRS',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mandarin SRS - Learn Chinese Pinyin',
    description: 'Master Mandarin Chinese pinyin with spaced repetition',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AnalyticsProvider>
          <QueryProvider>
            <AuthProvider>{children}</AuthProvider>
            <Toaster />
            <SonnerToaster />
            <CookieBanner />
          </QueryProvider>
        </AnalyticsProvider>
      </body>
    </html>
  )
}
