export const SW = `
const VER = 'v4';
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
    const offlineHtml =
      '<!DOCTYPE html><html lang="de"><head>' +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
      '<style>' +
      '*{box-sizing:border-box;margin:0;padding:0}' +
      ':root{--g:#3a7d44;--bg:#f2f2f7;--card:#fff;--t:#1c1c1e;--t2:#6e6e73}' +
      '@media(prefers-color-scheme:dark){:root{--bg:#1c1c1e;--card:#2c2c2e;--t:#f2f2f7;--t2:#8e8e93}}' +
      'body{background:var(--bg);color:var(--t);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;' +
        'min-height:100svh;display:flex;align-items:center;justify-content:center;padding:24px}' +
      '.card{background:var(--card);border-radius:20px;padding:36px 24px 28px;max-width:320px;width:100%;' +
        'text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.10)}' +
      '.icon{width:64px;height:64px;border-radius:50%;background:var(--g);' +
        'display:flex;align-items:center;justify-content:center;margin:0 auto 22px}' +
      '.icon svg{width:30px;height:30px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}' +
      'h1{font-size:20px;font-weight:700;margin-bottom:10px;letter-spacing:-.3px}' +
      'p{font-size:14px;color:var(--t2);line-height:1.55;margin-bottom:28px}' +
      'button{background:var(--g);color:#fff;border:none;border-radius:12px;padding:14px;' +
        'font-size:16px;font-weight:600;cursor:pointer;width:100%;letter-spacing:-.2px}' +
      'button:active{opacity:.85}' +
      '</style><title>Offline — Rezepte</title></head>' +
      '<body><div class="card">' +
      '<div class="icon"><svg viewBox="0 0 24 24">' +
      '<circle cx="7" cy="7" r="4"/>' +
      '<line x1="10" y1="10" x2="13" y2="14"/>' +
      '<line x1="14" y1="15.5" x2="18" y2="22"/>' +
      '</svg></div>' +
      '<h1>Keine Verbindung</h1>' +
      '<p>Du bisch offline. Überprüf dini Verbindung und versuchs nomol.</p>' +
      '<button onclick="location.reload()">Erneut versuchen</button>' +
      '</div></body></html>';
    return cached ?? new Response(offlineHtml, { status: 503, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }
}
`;
