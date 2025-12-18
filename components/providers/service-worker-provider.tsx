/**
 * Service Worker Registration Component
 *
 * Registers the service worker for offline caching and performance.
 * Only runs in production builds in the browser.
 */

'use client'

import { useEffect } from 'react'

export function ServiceWorkerProvider() {
  useEffect(() => {
    // Only register in production and if service workers are supported
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[App] Service Worker registered successfully:', registration.scope)

          // Check for updates periodically
          setInterval(
            () => {
              registration.update()
            },
            1000 * 60 * 60
          ) // Check every hour

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing

            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available, show update notification
                  console.log('[App] New service worker available')

                  // Optional: Show notification to user
                  if (
                    window.confirm(
                      'A new version of the app is available. Would you like to refresh?'
                    )
                  ) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' })
                    window.location.reload()
                  }
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('[App] Service Worker registration failed:', error)
        })

      // Listen for controller change (new service worker activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[App] Service Worker controller changed')
      })
    }
  }, [])

  return null // This component doesn't render anything
}

