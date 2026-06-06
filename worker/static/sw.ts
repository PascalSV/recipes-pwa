export const SW = `
const VER = 'v3';
const CACHE = 'recipes-' + VER;
const PRECACHE = ['/', '/login', '/styles.css', '/app.js', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.pathname.startsWith('/api/')) {
    e.respondWith(networkFirst(req));
    return;
  }
  if (/\\.(css|js|json|svg|png|ico|webp)$/.test(url.pathname)) {
    e.respondWith(cacheFirst(req));
    return;
  }
  e.respondWith(networkFirst(req));
});

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
  return res;
}

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
    return res;
  } catch {
    const cached = await caches.match(req);
    return cached ?? new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}
`;
