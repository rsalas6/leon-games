#!/usr/bin/env python3
"""Builds site/ for leon.beto.page: the hub, every game, the app manifest and an offline service worker.

Sources (hub.html, games/*.html) are written as page fragments (no <html>/<head>/<body>) so they can also be
previewed as Claude artifacts; this script wraps them into full pages and points them at the bundled vendor files.
"""
import json, os, re, shutil, time

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(ROOT, 'site')
PREVIEW = os.path.join(ROOT, 'preview')
KIT = open(os.path.join(ROOT, 'shared/dino-kit.js'), encoding='utf-8').read()
MODELS_JS = open(os.path.join(ROOT, 'shared/models.js'), encoding='utf-8').read()  # glTF model loader shared by the 3D games
INTRO = open(os.path.join(ROOT, 'shared/intro.html'), encoding='utf-8').read()  # LEÓN GAMES splash shown when any page opens
PAGES = [
    ('hub.html', 'index.html', ''),
    ('games/dino-race.html', 'dino-race/index.html', '../'),
    ('games/dino-puzzle.html', 'dino-puzzle/index.html', '../'),
    ('games/dino-hole.html', 'dino-hole/index.html', '../'),
]
APP_NAME = 'Juegos de León'
# iOS home-screen apps (black-translucent status bar) report a viewport shorter than the screen by the status bar height,
# leaving an empty strip at the bottom. Size the full-screen layers to the real screen height when that happens.
FULLH = '''<style>@media (display-mode: standalone), (display-mode: fullscreen){html,body{height:var(--fullh,100%)!important}#app,.bg,.world,#menu,#play,#win,#confetti,#leonIntro{bottom:auto!important;height:var(--fullh,100%)!important}}</style>
<script>(()=>{const fit=()=>{if(!(navigator.standalone===true||matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches))return;const land=innerWidth>innerHeight,h=land?Math.min(screen.width,screen.height):Math.max(screen.width,screen.height),gap=h-innerHeight;document.documentElement.style.setProperty('--fullh',(gap>0&&gap<=90?h:innerHeight)+'px')};fit();addEventListener('resize',fit);addEventListener('orientationchange',()=>setTimeout(fit,300))})()</script>'''

def read(p):
    return open(os.path.join(ROOT, p), encoding='utf-8').read()

def write(p, s):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf-8').write(s)

def build_page(src, out, up, version):
    s = read(src).replace('/*__DINO_KIT__*/', KIT).replace('/*__MODELS__*/', MODELS_JS)
    write(os.path.join(PREVIEW, os.path.basename(src)), s)  # fragment for artifact preview (CDN links kept)
    wait = 'window.LEON_WAIT=true;' if '/*__MODELS__*/' in read(src) else ''  # 3D games: the intro waits until the models are loaded
    head, body = s.split('</style>\n', 1)
    head = '\n'.join(l for l in (head + '</style>').split('\n') if 'claude:viewport-fit-sides' not in l and 'rel="preconnect"' not in l)
    head = re.sub(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^"]*">', f'<link rel="stylesheet" href="{up}vendor/fonts.css">', head)
    body = body.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', f'{up}vendor/three.min.js')
    if up:  # tells the game it lives inside the hub, so it shows the home button
        body = f"<script>window.LEON_HUB='{up}';</script>\n" + body
    page = f'''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="{APP_NAME}">
<meta name="theme-color" content="#5ac8ff">
<script>window.LEON_VERSION='{version}';{wait}</script>
<link rel="manifest" href="{up}manifest.webmanifest">
<link rel="apple-touch-icon" href="{up}icons/apple-touch-icon.png">
<link rel="icon" type="image/png" href="{up}icons/icon-192.png">
{head}
{FULLH}
</head>
<body>
{INTRO}{body}<script>if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('{up}sw.js',{{scope:'{up or './'}'}});</script>
</body>
</html>
'''
    page = page.replace('__UP__', up)  # relative path back to the site root (images, fonts)
    if re.search(r'googleapis|cdnjs|gstatic', page):
        raise SystemExit(f'External URL left in {out}')
    write(os.path.join(SITE, out), page)

def main():
    version = time.strftime('%Y%m%d%H%M%S')
    shutil.rmtree(SITE, ignore_errors=True)
    shutil.copytree(os.path.join(ROOT, 'vendor'), os.path.join(SITE, 'vendor'))
    shutil.copytree(os.path.join(ROOT, 'icons'), os.path.join(SITE, 'icons'))
    shutil.copytree(os.path.join(ROOT, 'img'), os.path.join(SITE, 'img'))
    shutil.copytree(os.path.join(ROOT, 'models'), os.path.join(SITE, 'models'))
    for src, out, up in PAGES:
        build_page(src, out, up, version)
    missing = [i for i in re.findall(r"\['(\d\d-[a-z-]+)',", read('games/dino-puzzle.html')) if not os.path.exists(os.path.join(ROOT, 'img/puzzle', i + '.webp'))]
    if missing:
        raise SystemExit(f'Missing puzzle images: {missing}')
    write(os.path.join(SITE, 'manifest.webmanifest'), json.dumps({
        'name': APP_NAME, 'short_name': 'León', 'lang': 'es',
        'description': 'Juegos de dinosaurios para León. Funcionan sin internet.',
        'start_url': './', 'scope': './', 'display': 'fullscreen', 'orientation': 'any',
        'background_color': '#5ac8ff', 'theme_color': '#5ac8ff',
        'icons': [
            {'src': 'icons/icon-192.png', 'sizes': '192x192', 'type': 'image/png'},
            {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png'},
            {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'},
        ],
    }, ensure_ascii=False, indent=2))
    dirs = [out.rsplit('/', 1)[0] + '/' for _, out, up in PAGES if up]
    files = ['./'] + dirs
    for d, _, fs in os.walk(SITE):
        for f in fs:
            rel = os.path.relpath(os.path.join(d, f), SITE).replace(os.sep, '/')
            if rel not in ('sw.js', '_headers', 'version.json') and not f.startswith('.'):
                files.append(rel)
    write(os.path.join(SITE, 'version.json'), json.dumps({'v': version}))  # read by the hub's update button
    sw = read('sw.template.js').replace('__VERSION__', version).replace('__FILES__', ', '.join(f"'{f}'" for f in sorted(files)))
    write(os.path.join(SITE, 'sw.js'), sw)
    write(os.path.join(SITE, '_headers'), ''.join(f'{p}\n  Cache-Control: no-cache\n' for p in ['/sw.js', '/version.json', '/*.html', '/'] + ['/' + d for d in dirs]))
    print(f'site/ ready (version {version}, {len(files)} cached files)')

if __name__ == '__main__':
    main()
