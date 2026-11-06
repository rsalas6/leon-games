// Offline support with on-demand loading:
// - CORE (the hub: its page, game icons, hub art, fonts) is stored when the app is installed.
// - Each game (its page, three.js, 3D models, pictures) is stored the first time it is opened, so only what is
//   played gets downloaded, and then it keeps working offline.
const CACHE = 'leon-games-20261106080458';
const CORE = ['./', 'icons/bichos.webp', 'icons/bolos.webp', 'icons/bomberos.webp', 'icons/camion.webp', 'icons/colorear.webp', 'icons/cruza.webp', 'icons/dino-hide.webp', 'icons/dino-hole.webp', 'icons/dino-puzzle.webp', 'icons/dino-race.webp', 'icons/frutas.webp', 'icons/icon-192.png', 'icons/pinguinos.webp', 'icons/pinta.webp', 'icons/piratas.webp', 'icons/rescate.webp', 'icons/topos.webp', 'icons/zombito.webp', 'img/hub3d-tall.webp', 'img/hub3d-wide.webp', 'img/splash-tall.webp', 'img/splash-wide.webp', 'index.html', 'manifest.webmanifest', 'vendor/fonts.css', 'vendor/fonts/XRXV3I6Li01BKofINeaBTMnFcQ.woff2', 'vendor/fonts/XRXV3I6Li01BKofIO-aBTMnFcQIG.woff2', 'vendor/fonts/i7dPIFZ9Zz-WBtRtedDbYE98RXi4EwSsbg.woff2', 'vendor/fonts/i7dPIFZ9Zz-WBtRtedDbYEF8RXi4EwQ.woff2'];
self.addEventListener('install', e => {
  // cache: 'reload' skips the browser's HTTP cache so a new version never stores old copies
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keep = await caches.open(CACHE), coreUrls = new Set(CORE.map(f => new URL(f, self.registration.scope).href));
    // Carry over the game files that were already downloaded (models, pictures) so they stay available offline
    for (const k of await caches.keys()) {
      if (k === CACHE) continue;
      const old = await caches.open(k);
      for (const req of await old.keys()) {
        if (coreUrls.has(req.url)) continue; // the hub comes fresh; game pages and files already opened stay (pages refresh online)
        if (!(await keep.match(req))) { const r = await old.match(req); if (r) await keep.put(req, r); }
      }
      await caches.delete(k);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // The version file always comes from the network so the hub can tell when there is an update
  if (new URL(req.url).pathname.endsWith('/version.json')) { e.respondWith(fetch(req, { cache: 'no-store' })); return; }
  // Pages: network first (to pick up updates), cached copy when offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(req, c)); return r; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match(new URL('index.html', req.url).href)).then(r => r || caches.match('./'))));
    return;
  }
  // Everything else: stored copy first; if it is not stored yet, download it once and keep it
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(r => {
    if (r.ok) { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(new Request(new URL(req.url).pathname), c)); }
    return r;
  })));
});
