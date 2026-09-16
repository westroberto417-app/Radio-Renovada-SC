/**
 * Service Worker - Radio Corrientes Viva
 * Updated Cache Strategy: Network-First for App Shell, Bundles & Dynamic APIs,
 * Cache Fallback for offline resilience, and direct pass-through for live audio streaming.
 */

const CACHE_VERSION = 'v7.3.0-rcv';
const STATIC_CACHE = `rcv-static-${CACHE_VERSION}`;
const API_CACHE = `rcv-api-${CACHE_VERSION}`;
const MEDIA_CACHE = `rcv-media-${CACHE_VERSION}`;

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/logo.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-192x192.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/screenshot-mobile.png',
  '/screenshot-desktop.png',
  '/manifest.json'
];

const CURRENT_CACHES = [STATIC_CACHE, API_CACHE, MEDIA_CACHE];

// Helper to determine if a request is for an audio stream
function isAudioStream(url, request) {
  return (
    url.includes('sp.unored.com') ||
    url.includes('rf.com.ar') ||
    url.includes('stream') ||
    url.includes('icecast') ||
    url.endsWith('.mp3') ||
    url.endsWith('.aac') ||
    url.endsWith('.m3u8') ||
    request.headers.get('range') !== null ||
    request.destination === 'audio'
  );
}

// Helper to determine if a request is for dynamic API data
function isApiRoute(url) {
  return url.pathname.startsWith('/api/');
}

// Helper to determine if request is an image asset
function isImage(url, request) {
  return (
    request.destination === 'image' ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico)$/i) ||
    url.hostname.includes('images.unsplash.com')
  );
}

// 1. INSTALL: Cache core assets and skip waiting immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('[SW] Core assets precache notice:', err);
      });
    })
  );
});

// 2. ACTIVATE: Immediately delete ALL legacy and outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!CURRENT_CACHES.includes(key)) {
            console.log('[SW] Purging old cache storage:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      // Notify all active clients that the new Service Worker is live
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
        });
      });
    })
  );
});

// 3. FETCH STRATEGIES
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Only intercept GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // A. AUDIO STREAMING: Completely bypass Service Worker Cache
  if (isAudioStream(request.url, request)) {
    event.respondWith(fetch(request));
    return;
  }

  // B. DYNAMIC API ROUTES: Direct Network fetch with cache fallback for offline
  if (isApiRoute(url)) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response(
            JSON.stringify({ error: 'offline', message: 'Contenido no disponible sin conexión.' }),
            { headers: { 'Content-Type': 'application/json' }, status: 503 }
          );
        })
    );
    return;
  }

  // C. APP NAVIGATION & HTML: Network-First to guarantee latest updates
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match('/index.html');
          return cached || (await caches.match(request));
        })
    );
    return;
  }

  // D. IMAGES: Cache First with network revalidation
  if (isImage(url, request)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(MEDIA_CACHE).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // E. JAVASCRIPT / CSS / ASSETS: Network-First to immediately deliver code changes
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        return new Response('Offline resource not available', { status: 503 });
      })
  );
});

// 4. MESSAGE LISTENER
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && (event.data.type === 'CLEAR_ALL_CACHES' || event.data.type === 'CLEAR_API_CACHE')) {
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(keys.map((k) => caches.delete(k)));
      }).then(() => {
        return self.clients.claim();
      })
    );
  }
});
