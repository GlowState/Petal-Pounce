// Versioned offline game shell. Keep navigation fresh when online so GitHub Pages
// deploys do not appear unchanged on phones with an older cached home screen.
const CACHE = 'petal-pounce-v18';
const SHELL = [
  './', './index.html', './privacy.html',
  './style.css?v=18', './shop.css?v=18', './game.mjs?v=18',
  './engine.mjs?v=18', './scenery.mjs?v=18', './flowers.mjs?v=18',
  './hold-controls.mjs?v=18', './profile.mjs?v=18',
  './bee.svg', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png'
];
self.addEventListener('install', event => event.waitUntil(
  caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())
));
self.addEventListener('activate', event => event.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim())
));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(async () => (await caches.match(event.request)) || caches.match('./index.html'))
    );
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
    }
    return response;
  })));
});
