import type { Metadata } from 'next'
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
