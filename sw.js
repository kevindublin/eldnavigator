const CACHE_NAME = 'eld-nav-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/eld-data.json',
  '/manifest.json'
];

// Install Event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
});

// Fetch Event (Offline Capability)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});