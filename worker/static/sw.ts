export const SW = `
const VER = '__SW_VERSION__';
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
      '.icon svg{width:30px;height:30px;fill:#fff}' +
      'h1{font-size:20px;font-weight:700;margin-bottom:10px;letter-spacing:-.3px}' +
      'p{font-size:14px;color:var(--t2);line-height:1.55;margin-bottom:28px}' +
      'button{background:var(--g);color:#fff;border:none;border-radius:12px;padding:14px;' +
        'font-size:16px;font-weight:600;cursor:pointer;width:100%;letter-spacing:-.2px}' +
      'button:active{opacity:.85}' +
      '</style><title>Offline — Pascals Rezeptesammlung</title></head>' +
      '<body><div class="card">' +
      '<div class="icon"><svg viewBox="0 0 24 24" fill="currentColor">' +
      '<path fill-rule="evenodd" d="M6.5,2 L17.5,2 C20,4 16,11 14,12.5 L14,13.5 L10,13.5 L10,12.5 C8,11 4,4 6.5,2 Z M9.5,4.5 L9.5,9.5 L10.5,9.5 L10.5,4.5 Z M11.5,4 L11.5,10 L12.5,10 L12.5,4 Z M13.5,4.5 L13.5,9.5 L14.5,9.5 L14.5,4.5 Z"/>' +
      '<rect x="10" y="13.5" width="4" height="5"/>' +
      '<polygon points="10.5,20 12,23.5 16,23.5 14.5,20"/>' +
      '</svg></div>' +
      '<h1 id="t"></h1>' +
      '<p id="m"></p>' +
      '<button id="b" onclick="location.reload()"></button>' +
      '</div>' +
      '<script>' +
      'var c=document.cookie,en=c.indexOf("lang=en")>-1||(c.indexOf("lang=")<0&&navigator.language.startsWith("en"));' +
      'document.getElementById("t").textContent=en?"No connection":"Keine Verbindung";' +
      'document.getElementById("m").textContent=en?"This page isn\'t available offline. Please check your internet connection and try again.":"Diese Seite ist offline nicht verfügbar. Bitte prüfe deine Verbindung und versuche es erneut.";' +
      'document.getElementById("b").textContent=en?"Try again":"Erneut versuchen";' +
      '</script>' +
      '</body></html>';
    return cached ?? new Response(offlineHtml, { status: 503, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }
}
`;
