self.addEventListener('install', (e) => {
  console.log('[ServiceWorker] Install');
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  console.log('[ServiceWorker] Activate');
});

self.addEventListener('fetch', (e) => {
  // Empty fetch handler to satisfy PWA requirements
});
