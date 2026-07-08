# Retroix 🕹️

> A tiny, **dependency-free** retro arcade game engine — the shared parts every small canvas game needs, extracted into one file you can drop in with a `<script>` tag.

![No build step](https://img.shields.io/badge/build-none-brightgreen)
![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-no_dependencies-f7df1e)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

Retroix was extracted from a family of vanilla-JS arcade games
([Paddix](https://github.com/DanMat/Paddix), [Alienix](https://github.com/DanMat/Alienix),
[Space-Jam](https://github.com/DanMat/Space-Jam), [Castle](https://github.com/DanMat/Castle) …)
that all kept re-implementing the same plumbing. It gives you:

- 🖥️ **DPI-aware canvas** — a fixed logical resolution scaled crisply to any size.
- 🔁 **Render-safe game loop** — `requestAnimationFrame` with a clamped delta; can't die mid-frame.
- ⌨️ **Input** — keyboard (arrows + WASD → named actions), mouse and touch in logical coords.
- 🔊 **8-bit audio** — synthesized on the Web Audio API, *zero sample files*: SFX presets (coin, jump, laser, explosion, powerup, hit…), short jingles, and custom tones, with persistent mute/volume.
- 💥 **Game feel** — screen **shake**, **flash**, and **freeze-frame** (hitstop) to make hits land.
- 📐 **Collision** — AABB / circle / circle-rect / point overlap tests.
- 💾 **Storage** — namespaced, JSON-friendly `localStorage` for best scores and settings.
- 🏆 **Leaderboard** — Supabase REST with a localStorage fallback (`top` / `submit` / `qualifies`).
- 🪟 **Screens** — overlay manager, retro **3-initial high-score entry**, and a leaderboard table renderer.
- ✨ **gfx** — `roundRect`, a particle-burst system, and a fading toast helper.
- 🎨 **`retroix.css`** — the neon-on-dark theme (HUD, buttons, screens, initials, leaderboard).

…so a game is just its own `update(dt)` / `render(ctx)` and level data.

## Install

**No build step required.** Load it straight from a CDN — it's a UMD file, so
`window.Retroix` is available globally:

```html
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/retroix@0.2.0/retroix.css">
<script src="https://cdn.jsdelivr.net/npm/retroix@0.2.0/retroix.js"></script>
```

Or from the GitHub repo (no npm needed):

```html
<script src="https://cdn.jsdelivr.net/gh/DanMat/Retroix@v0.2.0/retroix.js"></script>
```

Or with a bundler:

```bash
npm install retroix
```
```js
import Retroix from 'retroix';
import 'retroix/css';
```

## Quick start

```html
<canvas id="game" width="480" height="640"></canvas>
<script>
  var view = Retroix.canvas('#game', 480, 640);   // dpr-aware
  var input = Retroix.input(view);                 // keyboard + pointer
  var board = Retroix.leaderboard({ gameId: 'demo' }); // local unless Supabase configured

  var x = 240, y = 320;
  Retroix.loop(function (dt) {
    var a = input.axis();
    x += a.x * 200 * dt; y += a.y * 200 * dt;
    var ctx = view.ctx;
    ctx.fillStyle = '#0a0a1c'; ctx.fillRect(0, 0, 480, 640);
    ctx.fillStyle = '#00e5ff'; Retroix.gfx.roundRect(ctx, x - 15, y - 15, 30, 30, 6); ctx.fill();
  }).start();
</script>
```

## API

| Call | What you get |
| --- | --- |
| `Retroix.canvas(el, w, h)` | `{ ctx, width, height, dpr, resize(), toLogical(cx,cy) }` |
| `Retroix.loop(step, opts)` | `{ start(), stop(), isRunning() }` — `step(dt)` in seconds |
| `Retroix.input(canvas, opts)` | `{ actions, pointer, down(a), axis(), onKeyDown(fn) }` |
| `Retroix.audio(opts)` | `{ coin(), jump(), laser(), explosion(), …, play(name), jingle(name), tone(spec), sequence(notes), mute(v), volume(v), toggle() }` |
| `Retroix.fx(dims, opts)` | `{ shake(a), flash(color,s), freeze(dur), frozen(), update(dt), preRender(ctx), postRender(ctx) }` |
| `Retroix.hit` | `rects(a,b)`, `circles(a,b)`, `circleRect(c,r)`, `pointRect(px,py,r)`, `pointCircle(px,py,c)` |
| `Retroix.storage(ns)` | `{ get(key,fallback), set(key,val), remove(key), keys(), clear() }` |
| `Retroix.leaderboard(cfg)` | `{ top(n), submit(initials,score,stage), qualifies(score), mode }` |
| `Retroix.screens(root)` | `{ show(id), hideAll(), current() }` over `[data-screen]` elements |
| `Retroix.initials(el, {onEnter})` | 3-letter entry: `{ value(), reset(), handleKey(e), active }` |
| `Retroix.renderLeaderboard(tbody, rows, opts)` | fills a `<tbody>` with score rows |
| `Retroix.gfx` | `roundRect`, `particles()` |
| `Retroix.toast(el)` | returns `toast(msg, ms)` |
| `Retroix.util` | `clamp, rand, randInt, pick, hypot, dist2, lerp, shuffle, escapeHtml` |

### 8-bit audio

No files — every sound is synthesized. The first key/tap unlocks audio
(browsers require a gesture); mute and volume persist across sessions.

```js
var sfx = Retroix.audio();     // { volume: 0.35 } by default

sfx.coin();                    // built-in presets
sfx.explosion();
sfx.play('laser');             // …or by name
sfx.jingle('win');             // short stingers: win / lose / levelup / gameover
sfx.tone({ wave: 'square', freq: 'C5', freqEnd: 'C6', dur: 0.15 }); // custom blip
sfx.sequence(['C5:0.08', 'E5', 'G5']);   // your own melody

sfx.toggle();                  // mute button; sfx.volume(0.5) to set level
```

### Game feel

```js
var fx = Retroix.fx(view);     // pass the canvas api (or { width, height })

// on a big hit:
sfx.hit(); fx.shake(0.6); fx.flash('#fff', 0.4); fx.freeze(0.05);

// in the loop:
fx.update(dt);
if (!fx.frozen()) { updateWorld(dt); }   // hitstop pauses the world, not the loop
fx.preRender(ctx);                        // shake offset applied
drawWorld(ctx);
fx.postRender(ctx);                       // flash overlay drawn on top
```

### Leaderboard config

```js
Retroix.leaderboard({
  supabaseUrl: 'https://YOUR-PROJECT.supabase.co', // blank = local only
  supabaseAnonKey: 'sb_publishable_...',           // public by design
  gameId: 'paddix',
  size: 10
});
```

The Supabase board expects a `scores` table (`game`, `initials`, `score`,
`stage`, `created_at`) protected by row-level-security. See any consuming game's
`docs/supabase.sql`.

### CSS

`retroix.css` styles `.rx-*` classes and reads CSS variables you can override
(`--rx-accent`, `--rx-pixel`, `--rx-panel`, …) to reskin per game. Load the
`Press Start 2P` font for the headings.

## License

[MIT](LICENSE) © DanMat
