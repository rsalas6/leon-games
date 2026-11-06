// Offline support with on-demand loading:
// - CORE (the hub: its page, game icons, hub art, fonts) is stored when the app is installed.
// - Each game (its page, three.js, 3D models, pictures) is stored the first time it is opened, so only what is
//   played gets downloaded, and then it keeps working offline.
const CACHE = 'leon-games-__VERSION__';
const CORE = [__FILES__];
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
