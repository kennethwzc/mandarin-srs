/**
 * Service Worker for Mandarin SRS
 *
 * Provides offline caching for instant repeat visits and better performance.
 *
 * Features:
 * - Cache static assets (JS, CSS, images)
 * - Cache API responses with network-first strategy
 * - Fallback for offline access
 */

const CACHE_NAME = 'mandarin-srs-v2'
const CACHE_VERSION = '2.0.0'

// Static assets to cache on install (only public pages that don't require auth)
// Auth-required pages (/dashboard, /lessons, /reviews) are cached dynamically on visit
const STATIC_ASSETS = ['/', '/login', '/signup']

// API routes to cache (network-first strategy)
const API_ROUTES = ['/api/dashboard/stats', '/api/lessons', '/api/user/profile']

/**
 * Install Event
 * Pre-cache essential static assets
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...')

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('[Service Worker] Installation complete')
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error)
      })
  )
})

/**
 * Activate Event
 * Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...')

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('[Service Worker] Activation complete')
        // Claim all clients immediately
        return self.clients.claim()
      })
  )
})

/**
 * Fetch Event
 * Implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return
  }

  // Strategy 1: Network First for API routes (fresh data preferred)
  if (isApiRoute(url.pathname)) {
    event.respondWith(networkFirstStrategy(request))
    return
  }

  // Strategy 2: Cache First for static assets (speed preferred)
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request))
    return
  }

  // Strategy 3: Stale-While-Revalidate for pages
  event.respondWith(staleWhileRevalidateStrategy(request))
})

/**
 * Network First Strategy
 * Try network first, fallback to cache if offline
 */
async function networkFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME)

  try {
    // Try network with 3-second timeout
    const networkResponse = await fetchWithTimeout(request, 3000)

    // Cache successful response
    if (networkResponse && networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    // Network failed - try cache
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
      console.log('[Service Worker] Serving from cache (offline):', request.url)
      return cachedResponse
    }

    // No cache available - return offline response
    return new Response(JSON.stringify({ error: 'Offline', message: 'No cached data available' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

/**
 * Cache First Strategy
 * Serve from cache, update cache in background
 */
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME)
  const cachedResponse = await cache.match(request)

  if (cachedResponse) {
    // Update cache in background
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          cache.put(request, response.clone())
        }
      })
      .catch(() => {
        // Silently fail background update
      })

    return cachedResponse
  }

  // Not in cache - fetch from network
  try {
    const networkResponse = await fetch(request)

    if (networkResponse && networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    return new Response('Offline', { status: 503 })
  }
}

/**
 * Stale-While-Revalidate Strategy
 * Return cached version immediately, update in background
 */
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(CACHE_NAME)
  const cachedResponse = await cache.match(request)

  // Fetch and update cache in background
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => null)

  // Return cached version immediately, or wait for network
  return cachedResponse || fetchPromise || new Response('Offline', { status: 503 })
}

/**
 * Fetch with timeout
 */
function fetchWithTimeout(request, timeout = 5000) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    }),
  ])
}

/**
 * Check if URL is an API route
 */
function isApiRoute(pathname) {
  return pathname.startsWith('/api/') && API_ROUTES.some((route) => pathname.startsWith(route))
}

/**
 * Check if URL is a static asset
 */
function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/_next/static/') ||
    pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|ico)$/)
  )
}

/**
 * Message Handler
 * Allow manual cache clearing from client
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        console.log('[Service Worker] Cache cleared')
        event.ports[0].postMessage({ success: true })
      })
    )
  }

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
