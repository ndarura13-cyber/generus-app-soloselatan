/* ═══════════════════════════════════════════════════════════════
   sw.js — PPG Solo Selatan Service Worker (Root Scope: /)
   Strategy: Network-First with Cache Fallback for HTML & dynamic data,
             Cache-First for static assets (images, icons, styles, fonts)
   ═══════════════════════════════════════════════════════════════ */

const CACHE_NAME = 'ppg-generus-v4.6';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/features/login/login.html',
  '/features/login/login.css',
  '/features/login/login.js',
  '/features/dashboard/dashboard.html',
  '/features/dashboard/dashboard.css',
  '/features/dashboard/dashboard.js',
  '/features/dashboard/dashboard-common.js',
  '/features/dashboard/dashboard-supabase.js',
  '/features/dashboard/dashboard-pengurus.js',
  '/features/dashboard/dashboard-proker.js',
  '/features/dashboard/dashboard-pembiasaan.js',
  '/features/dashboard/dashboard-generus.js',
  '/features/dashboard/dashboard-kbm.js',
  '/features/laporan/laporan-pembiasaan.html',
  '/features/laporan/cetak-absensi.html',
  '/features/laporan/laporan-kehadiran.html',
  '/features/laporan/template-laporan.html',
  '/src/style.css',
  '/src/app.js',
  '/src/db-master.js',
  '/src/manifest.json',
  '/src/image/hero.jpg',
  '/src/image/icon-192.png',
  '/src/image/icon-512.png'
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
