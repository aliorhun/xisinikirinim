const CACHE_NAME = 'xisinikirinim-offline-v14';
const APP_SHELL = [
  './',
  './index.html',
  './euler-lab.css',
  './euler-lab.js',
  './learning-games.css',
  './learning-games.js',
  './debye-camera.css',
  './debye-camera.js',
  './debye-camera.js?v=20261104-sample-refresh',
  './powder-exercises.css',
  './powder-exercises.js',
  './crystal-systems.css',
  './crystal-systems.js',
  './bravais-powder-atlas.css',
  './bravais-powder-atlas.js',
  './vendor/three-r128.min.js',
  './vendor/prism-1.29.0.js',
  './vendor/prism-python-1.29.0.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      await cache.put('./index.html', response.clone());
      await cache.put('./', response.clone());
    }
    return response;
  } catch (error) {
    return (await cache.match(request)) ||
           (await cache.match('./index.html')) ||
           Response.error();
  }
}

async function cacheFirstLocalAsset(request) {
  // Only consult the active offline shell: older caches may contain obsolete camera code.
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type !== 'opaque') {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return Response.error();
  }
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(event.request));
    return;
  }

  event.respondWith(cacheFirstLocalAsset(event.request));
});
