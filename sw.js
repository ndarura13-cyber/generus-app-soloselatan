/* ═══════════════════════════════════════════════════════════════
   sw.js — PPG Solo Selatan Service Worker (Root Scope: /)
   Strategy: Network-First with Cache Fallback for HTML & dynamic data,
             Cache-First for static assets (images, icons, styles, fonts)
   ═══════════════════════════════════════════════════════════════ */

const CACHE_NAME = 'ppg-generus-v3.8';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/features/login.html',
  '/features/login.css',
  '/features/login.js',
  '/features/dashboard.html',
  '/features/dashboard.css',
  '/features/dashboard.js',
  '/features/laporan-pembiasaan.html',
  '/features/cetak-absensi.html',
  '/features/laporan-kehadiran.html',
  '/src/style.css',
  '/src/app.js',
  '/src/db-master.js',
  '/src/manifest.json',
  '/image/hero.jpg',
  '/image/icon-192.png',
  '/image/icon-512.png',
  '/icons/icon-192.png'
];

/* ── 1. INSTALL EVENT ─────────────────────────────────────── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Safe batch caching: satu gagal tidak menggagalkan seluruh install
      const cachePromises = STATIC_ASSETS.map(async (url) => {
        try {
          const response = await fetch(url, { cache: 'no-cache' });
          if (response && response.ok) {
            await cache.put(url, response);
          }
        } catch (err) {
          console.warn('[SW] Caching skipped for:', url, err.message);
        }
      });
      await Promise.allSettled(cachePromises);
      return self.skipWaiting();
    })
  );
});

/* ── 2. ACTIVATE EVENT (Clean Old Caches) ──────────────────── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

/* ── 3. FETCH EVENT ───────────────────────────────────────── */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Hanya tangani GET requests
  if (request.method !== 'GET') return;
  // Skip ekstensi chrome
  if (url.protocol === 'chrome-extension:') return;

  // A. Navigasi Halaman HTML (Network-First -> Cache fallback)
  if (request.mode === 'navigate' || (request.headers.get('Accept') && request.headers.get('Accept').includes('text/html'))) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // B. Asset Statis (CSS, JS, Images, Fonts) -> Network-First (agar selalu dapat update terbaru saat online)
  event.respondWith(
    fetch(request).then((networkResponse) => {
      if (!networkResponse || networkResponse.status !== 200) {
        return caches.match(request).then(res => res || networkResponse);
      }
      const responseClone = networkResponse.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
      return networkResponse;
    }).catch(async () => {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) return cachedResponse;
    })
  );
});

/* ── 4. MESSAGE EVENT ─────────────────────────────────────── */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
