// Caches every game on the device so the whole app works 100% offline after the first visit
const CACHE = 'leon-games-20261020170103';
const FILES = ['./', 'dino-hole/', 'dino-hole/index.html', 'dino-puzzle/', 'dino-puzzle/index.html', 'dino-race/', 'dino-race/index.html', 'icons/apple-touch-icon.png', 'icons/dino-hole.png', 'icons/dino-puzzle.png', 'icons/dino-race.png', 'icons/icon-192.png', 'icons/icon-512.png', 'img/hole/lvl-desierto.webp', 'img/hole/lvl-nieve.webp', 'img/hole/lvl-playa.webp', 'img/hole/lvl-selva.webp', 'img/hole/lvl-volcan.webp', 'img/hole/lvl2-desierto.webp', 'img/hole/lvl2-nieve.webp', 'img/hole/lvl2-playa.webp', 'img/hole/lvl2-selva.webp', 'img/hole/lvl2-volcan.webp', 'img/hub/bg-tall.webp', 'img/hub/bg-wide.webp', 'img/leon-loading.webp', 'img/menus/bg-hole-tall.webp', 'img/menus/bg-hole-wide.webp', 'img/menus/bg-puzzle-tall.webp', 'img/menus/bg-puzzle-wide.webp', 'img/puzzle/01-trex.webp', 'img/puzzle/02-trice.webp', 'img/puzzle/03-brachio.webp', 'img/puzzle/04-stego.webp', 'img/puzzle/05-ptero.webp', 'img/puzzle/06-egg.webp', 'img/puzzle/07-leon-trex.webp', 'img/puzzle/08-dragon.webp', 'img/puzzle/09-ankylo.webp', 'img/puzzle/10-beach.webp', 'img/puzzle/11-mosa.webp', 'img/puzzle/12-train.webp', 'img/puzzle/13-lion.webp', 'img/puzzle/14-elephant.webp', 'img/puzzle/15-giraffe.webp', 'img/puzzle/16-monkey.webp', 'img/puzzle/17-panda.webp', 'img/puzzle/18-penguins.webp', 'img/puzzle/19-puppy.webp', 'img/puzzle/20-kitten.webp', 'img/puzzle/21-farm.webp', 'img/puzzle/22-octopus.webp', 'img/puzzle/23-turtle.webp', 'img/puzzle/24-owl.webp', 'img/puzzle/25-firetruck.webp', 'img/puzzle/26-rocket.webp', 'img/puzzle/27-airplane.webp', 'img/puzzle/28-tractor.webp', 'img/puzzle/29-bunny.webp', 'img/puzzle/30-whale.webp', 'index.html', 'manifest.webmanifest', 'vendor/fonts.css', 'vendor/fonts/XRXV3I6Li01BKofINeaBTMnFcQ.woff2', 'vendor/fonts/XRXV3I6Li01BKofIO-aBTMnFcQIG.woff2', 'vendor/fonts/i7dPIFZ9Zz-WBtRtedDbYE98RXi4EwSsbg.woff2', 'vendor/fonts/i7dPIFZ9Zz-WBtRtedDbYEF8RXi4EwQ.woff2', 'vendor/fonts/press-start-2p-latin.woff2', 'vendor/three.min.js'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
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
  // Everything else: cached copy first
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
});
