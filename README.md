# Leon's Games

Dinosaur games for Leon, served at https://leon.beto.page.
Built for iPhone and iPad: installable as an app (Add to Home Screen) and fully playable offline.

| Game | Path | For |
| --- | --- | --- |
| Dino Race | `/dino-race/` | Switch dinosaurs to match the terrain and win the race (15 levels) |
| Dino Kitchen | `/dino-kitchen/` | Cook 15 recipes by adding ingredients in order, then mix, blend or bake and feed the dinosaur (made for a 2-year-old) |
| Dino Bath | `/dino-bath/` | Clean a muddy dinosaur step by step: brush, soap, water, towel, teeth, stars (15 levels, made for a 2-year-old) |

## Project layout

| Path | What it is |
| --- | --- |
| `hub.html` | Home screen with the game icons |
| `games/*.html` | One file per game (Three.js) |
| `shared/dino-kit.js` | Toon materials, outlines and the 8 dinosaur models, inlined into games at build time |
| `vendor/` | Three.js r128 and fonts, bundled so nothing loads from the internet |
| `icons/` | App and game icons |
| `build.py` | Builds `site/`: full pages, app manifest, offline service worker |
| `site/` | Deployable output served by Cloudflare Pages |

## Workflow

1. Edit `hub.html` or a game in `games/`.
2. Run `python3 build.py`.
3. Commit and push to `main`. Cloudflare Pages (project `leon-games`, connected to this repo) deploys `site/`.

Inside the hub, each game shows a home button that must be held for one second, so a small child doesn't exit by accident.

## Local preview

```sh
python3 build.py && python3 -m http.server 8000 --directory site
```
