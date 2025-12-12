// Vibe Editor Service Worker
// Implements caching strategies for offline support

const CACHE_NAME = 'vibe-editor-v1';
const RUNTIME_CACHE = 'vibe-editor-runtime-v1';

// Static assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon.svg',
  '/logo.svg',
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first for static assets
  cacheFirst: [
    /\.(css|js|woff2?|ttf|eot|png|jpg|jpeg|gif|svg|ico|webp)$/,
    /^\/_next\/static\//,
  ],
  // Network first for API and dynamic content
  networkFirst: [
    /^\/api\//,
    /^\/_next\/data\//,
  ],
  // Stale while revalidate for pages
  staleWhileRevalidate: [
    /^\/dashboard/,
    /^\/playground/,
    /^\/settings/,
  ],
};

// Install event - precache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching assets');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache failed for some assets:', err);
        // Continue even if some assets fail to cache
        return Promise.resolve();
      });
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Helper: Check if URL matches any pattern
function matchesPattern(url, patterns) {
  return patterns.some((pattern) => pattern.test(url));
}

// Helper: Cache first strategy
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Cache first fetch failed:', error);
    throw error;
  }
}

// Helper: Network first strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Helper: Stale while revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await caches.match(request);
  
  // Fetch in background
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch((error) => {
    console.warn('[SW] Background fetch failed:', error);
    return null;
  });

  // Return cached immediately if available, otherwise wait for fetch
  if (cached) {
    return cached;
  }
  
  const response = await fetchPromise;
  if (response) {
    return response;
  }
  
  throw new Error('No cached response and network failed');
}

// Fetch event - apply caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests (except for common CDNs)
  if (url.origin !== self.location.origin) {
    // Allow fonts from Google Fonts
    if (!url.hostname.includes('fonts.googleapis.com') && 
        !url.hostname.includes('fonts.gstatic.com')) {
      return;
    }
  }
  
  const pathname = url.pathname;
  
  event.respondWith(
    (async () => {
      try {
        // Cache first for static assets
        if (matchesPattern(pathname, CACHE_STRATEGIES.cacheFirst)) {
          return await cacheFirst(request);
        }
        
        // Network first for API
        if (matchesPattern(pathname, CACHE_STRATEGIES.networkFirst)) {
          return await networkFirst(request);
        }
        
        // Stale while revalidate for pages
        if (matchesPattern(pathname, CACHE_STRATEGIES.staleWhileRevalidate)) {
          return await staleWhileRevalidate(request);
        }
        
        // Default: network first
        return await networkFirst(request);
      } catch (error) {
        console.error('[SW] Fetch failed:', error);
        
        // For navigation requests, show offline page
        if (request.mode === 'navigate') {
          const offlinePage = await caches.match('/offline.html');
          if (offlinePage) {
            return offlinePage;
          }
        }
        
        // Return a basic offline response
        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' },
        });
      }
    })()
  );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data === 'clearCache') {
    event.waitUntil(
      caches.keys().then((names) => 
        Promise.all(names.map((name) => caches.delete(name)))
      )
    );
  }
});

console.log('[SW] Service Worker loaded');
