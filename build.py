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
PAGES = [
    ('hub.html', 'index.html', ''),
    ('games/dino-race.html', 'dino-race/index.html', '../'),
    ('games/dino-bath.html', 'dino-bath/index.html', '../'),
]
APP_NAME = 'Juegos de León'

def read(p):
    return open(os.path.join(ROOT, p), encoding='utf-8').read()

def write(p, s):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf-8').write(s)

def build_page(src, out, up):
    s = read(src).replace('/*__DINO_KIT__*/', KIT)
    write(os.path.join(PREVIEW, os.path.basename(src)), s)  # fragment for artifact preview (CDN links kept)
    head, body = s.split('</style>\n', 1)
    head = '\n'.join(l for l in (head + '</style>').split('\n') if 'claude:viewport-fit-sides' not in l and 'rel="preconnect"' not in l)
    head = re.sub(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^"]*">', f'<link rel="stylesheet" href="{up}vendor/fonts.css">', head)
    body = body.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', f'{up}vendor/three.min.js')
    if up:
        body = body.replace('<script src=', f"<script>window.LEON_HUB='{up}';</script>\n<script src=", 1)
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
<link rel="manifest" href="{up}manifest.webmanifest">
<link rel="apple-touch-icon" href="{up}icons/apple-touch-icon.png">
<link rel="icon" type="image/png" href="{up}icons/icon-192.png">
{head}
</head>
<body>
{body}<script>if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('{up}sw.js',{{scope:'{up or './'}'}});</script>
</body>
</html>
'''
    if re.search(r'googleapis|cdnjs|gstatic', page):
        raise SystemExit(f'External URL left in {out}')
    write(os.path.join(SITE, out), page)

def main():
    version = time.strftime('%Y%m%d%H%M%S')
    shutil.rmtree(SITE, ignore_errors=True)
    shutil.copytree(os.path.join(ROOT, 'vendor'), os.path.join(SITE, 'vendor'))
    shutil.copytree(os.path.join(ROOT, 'icons'), os.path.join(SITE, 'icons'))
    for src, out, up in PAGES:
        build_page(src, out, up)
    write(os.path.join(SITE, 'manifest.webmanifest'), json.dumps({
        'name': APP_NAME, 'short_name': 'León', 'lang': 'es',
        'description': 'Juegos de dinosaurios para León: Dino Race y Baño de Dinos. Funcionan sin internet.',
        'start_url': './', 'scope': './', 'display': 'fullscreen', 'orientation': 'any',
        'background_color': '#5ac8ff', 'theme_color': '#5ac8ff',
        'icons': [
            {'src': 'icons/icon-192.png', 'sizes': '192x192', 'type': 'image/png'},
            {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png'},
            {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'},
        ],
    }, ensure_ascii=False, indent=2))
    files = ['./', 'dino-race/', 'dino-bath/']
    for d, _, fs in os.walk(SITE):
        for f in fs:
            rel = os.path.relpath(os.path.join(d, f), SITE).replace(os.sep, '/')
            if rel not in ('sw.js', '_headers') and not f.startswith('.'):
                files.append(rel)
    sw = read('sw.template.js').replace('__VERSION__', version).replace('__FILES__', ', '.join(f"'{f}'" for f in sorted(files)))
    write(os.path.join(SITE, 'sw.js'), sw)
    write(os.path.join(SITE, '_headers'), '/sw.js\n  Cache-Control: no-cache\n/*.html\n  Cache-Control: no-cache\n/\n  Cache-Control: no-cache\n/dino-race/\n  Cache-Control: no-cache\n/dino-bath/\n  Cache-Control: no-cache\n')
    print(f'site/ ready (version {version}, {len(files)} cached files)')

if __name__ == '__main__':
    main()
