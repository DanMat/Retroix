# Retroix 🕹️

> A tiny, **dependency-free** retro game engine in a single file. Drop it in with a `<script>` tag — no build step, no npm required — and everything a small canvas game needs is there.

[![Play the games](https://img.shields.io/badge/▶_Games-Live_Gallery-ffd166?style=for-the-badge)](https://danmat.github.io/Retroix/)
&nbsp;
![No build step](https://img.shields.io/badge/build-none-brightgreen)
![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-no_dependencies-f7df1e)
[![npm](https://img.shields.io/npm/v/retroix?color=cb3837&logo=npm)](https://www.npmjs.com/package/retroix)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

Retroix is a general-purpose 2D game engine for the browser. It bundles the
plumbing every small game re-implements — a DPI-aware canvas, a crash-safe game
loop, input, sound, physics, a camera, screens, leaderboards and more — so your
game is just its own `update(dt)` / `render(ctx)` and level data. It ships as one
UMD file (`window.Retroix`), works from a CDN or a bundler, and has **zero
dependencies**.

A whole **[gallery of games](https://danmat.github.io/Retroix/)** is built on it —
they're the showcase, not the point. It gives you:

- 🖥️ **DPI-aware canvas** — a fixed logical resolution scaled crisply to any size.
- 🔁 **Render-safe game loop** — `requestAnimationFrame` with a clamped delta; can't die mid-frame.
- ⌨️ **Input** — keyboard (arrows + WASD → named actions), mouse and touch in logical coords.
- 🔊 **8-bit audio** — synthesized on the Web Audio API, *zero sample files*: SFX presets (coin, jump, laser, explosion, powerup, hit…), short jingles, and custom tones, with persistent mute/volume.
- 🎵 **Chiptune music** — looping, multi-voice background tracks defined as data (no files): per-level tunes with crossfade, pause/resume, ducking under loud SFX, and an independent music volume under one master mute.
- 💥 **Game feel** — screen **shake**, **flash**, and **freeze-frame** (hitstop) to make hits land.
- 🧲 **Arcade physics** — gravity/friction/max-vel integration + axis-separated AABB resolution with `onGround`/`blocked` flags.
- 🗺️ **Tile grid** — cell↔world coords, and `solids()` that feeds collision rects straight into physics.
- 🎥 **Camera** — follow a target, clamp to level bounds, `begin/end` world transform.
- 🔀 **State machine** — `title` / `play` / `pause` / `over` with enter/update/exit hooks.
- ⏱️ **Timers & tweens** — `after` / `every` callbacks and eased property tweens.
- 📐 **Collision** — AABB / circle / circle-rect / point overlap tests.
- 💾 **Storage** — namespaced, JSON-friendly `localStorage` for best scores and settings.
- 🤖 **Autopilot** — a secret-combo dev mode that turns a bot loose to play your game unattended: checks it's *finishable*, and surfaces crashes and soft-locks with an on-screen report.
- 🏆 **Leaderboard** — Supabase REST with a localStorage fallback (`top` / `submit` / `qualifies`).
- 🪟 **Screens** — overlay manager, retro **3-initial high-score entry**, and a leaderboard table renderer.
- ✨ **gfx** — `roundRect`, a particle-burst system, and a fading toast helper.
- 🎨 **`retroix.css`** — the neon-on-dark theme (HUD, buttons, screens, initials, leaderboard).

…so a game is just its own `update(dt)` / `render(ctx)` and level data.

## Games built on Retroix

Seven full games run on the engine — each just a few hundred lines of game logic.
They're the proving ground (and the fun part). **▶ [Play them all in the live gallery](https://danmat.github.io/Retroix/).**

|  |  |
| :---: | :---: |
| [<img src="https://cdn.jsdelivr.net/gh/DanMat/Blastix@main/docs/social-preview.png" width="400" alt="Blastix">](https://danmat.github.io/Blastix/)<br>**[Blastix](https://danmat.github.io/Blastix/)** · run-and-gun platformer | [<img src="https://cdn.jsdelivr.net/gh/DanMat/Paddix@main/docs/social-preview.png" width="400" alt="Paddix">](https://danmat.github.io/Paddix/)<br>**[Paddix](https://danmat.github.io/Paddix/)** · brick-breaker |
| [<img src="https://cdn.jsdelivr.net/gh/DanMat/Alienix@main/docs/social-preview.png" width="400" alt="Alienix">](https://danmat.github.io/Alienix/)<br>**[Alienix](https://danmat.github.io/Alienix/)** · twin-stick survivor | [<img src="https://cdn.jsdelivr.net/gh/DanMat/Space-Jam@main/docs/social-preview.png" width="400" alt="Space-Jam">](https://danmat.github.io/Space-Jam/)<br>**[Space-Jam](https://danmat.github.io/Space-Jam/)** · side-scrolling shmup |
| [<img src="https://cdn.jsdelivr.net/gh/DanMat/BombJack@main/docs/social-preview.png" width="400" alt="BombJack">](https://danmat.github.io/BombJack/)<br>**[BombJack](https://danmat.github.io/BombJack/)** · vertical road shooter | [<img src="https://cdn.jsdelivr.net/gh/DanMat/Castle@main/docs/social-preview.png" width="400" alt="Castle">](https://danmat.github.io/Castle/)<br>**[Castle](https://danmat.github.io/Castle/)** · maze chase & rescue |
| [<img src="https://cdn.jsdelivr.net/gh/DanMat/Nimix@main/docs/social-preview.png" width="400" alt="Nimix">](https://danmat.github.io/Nimix/)<br>**[Nimix](https://danmat.github.io/Nimix/)** · beach game of Nim | |

## Install

**No build step required.** Load it straight from a CDN — it's a UMD file, so
`window.Retroix` is available globally:

```html
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/retroix@1.2.0/retroix.css">
<script src="https://cdn.jsdelivr.net/npm/retroix@1.2.0/retroix.js"></script>
```

Or from the GitHub repo (no npm needed):

```html
<script src="https://cdn.jsdelivr.net/gh/DanMat/Retroix@v1.2.0/retroix.js"></script>
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
| `Retroix.audio(opts)` | `{ coin(), …, play(name), jingle(name), tone(spec), sequence(notes), music(track), stopMusic(), pauseMusic(), resumeMusic(), duck(), musicVolume(v), mute(v), volume(v), toggle() }` |
| `Retroix.tracks` | built-in chiptune loops: `title`, `action`, `boss`, `calm` |
| `Retroix.fx(dims, opts)` | `{ shake(a), flash(color,s), freeze(dur), frozen(), update(dt), preRender(ctx), postRender(ctx) }` |
| `Retroix.hit` | `rects(a,b)`, `circles(a,b)`, `circleRect(c,r)`, `pointRect(px,py,r)`, `pointCircle(px,py,c)` |
| `Retroix.physics` | `body(opts)`, `move(body, solids, dt)` — arcade integration + AABB resolution |
| `Retroix.grid(cols, rows, tile)` | `{ at, set, cellAt, rectOf, forEach, solids(isSolid, region) }` |
| `Retroix.camera(view, opts)` | `{ x, y, follow(t,l), clamp(), begin(ctx), end(ctx), worldToScreen, screenToWorld }` |
| `Retroix.fsm(states, initial)` | `{ set(name,…), update(dt), render(ctx), is(name), current() }` |
| `Retroix.timer()` | `{ after(s,fn), every(s,fn), tween(obj,props,dur,ease,done), cancel(t), update(dt) }` |
| `Retroix.ease` | `linear, inQuad, outQuad, inOutQuad, inCubic, outCubic, outBack, outBounce` |
| `Retroix.storage(ns)` | `{ get(key,fallback), set(key,val), remove(key), keys(), clear() }` |
| `Retroix.autopilot(cfg)` | secret-combo test bot (finishability / chokepoints) — `{ start(), stop(), running() }` |
| `Retroix.jumpReach(opts)` | `{ maxDist, maxHeight, airtimeFrames, apexFrames }` from jump physics |
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

### Autopilot (dev-mode test bot)

A secret key combo (the **Konami code** by default) turns a bot loose to play
your game unattended — to check it's *finishable* and to surface crashes,
soft-locks and **impassable spots**. The engine can't *win* your game, so supply
a `bot(api)` policy + closures over your state. The recommended model: give the
game **infinite lives** (respawn in place) and pass `deaths()` (a monotonic
failure counter) + `location()`. The bot keeps trying; if it dies
`deathsPerSpot` times within one spot, that's flagged an impassable
**chokepoint** — with the coordinate to fix. A **stuck-watchdog**, **timeout**,
`isWin()`, and **crash capture** round it out, and the report names the worst
death hotspot. (No bot → a generic **masher** smoke-tests boot→play.)

```js
Retroix.autopilot({
  start:    function () { testMode = true; if (state === 'title') startGame(); }, // infinite lives
  stop:     function () { testMode = false; },
  bot:      botDrive,                                    // uses grid/physics to jump gaps
  progress: function () { return levelIndex * 1e5 + player.x; },
  location: function () { return levelIndex * 1e5 + deathX; },  // where it last died
  deaths:   function () { return deathCount; },          // you bump this on each respawn
  isWin:    function () { return wonFlag; },
  deathsPerSpot: 6
});
// toggle with ↑ ↑ ↓ ↓ ← → ← → B A. api: press/release/tap/only, t, frame.
```

Pair it with a **static** reachability check so you catch impossible geometry
without even running the bot:

```js
var reach = Retroix.jumpReach({ jump: JUMP, gravity: GRAV, run: RUN });
// reach.maxDist — if a level gap is wider than this, the jump is impossible.
```

### Chiptune background music

Tracks are **data, not files** — a tempo and a step grid per voice. Each token
is one step: a note (`C4`, `F#3`), `-` for a rest, or `.` to hold the previous
note one more step. Give each level its own tune; switching crossfades.

```js
sfx.music('action');                 // a built-in loop from Retroix.tracks
sfx.music(level.track, { fade: 0.6 });   // …or your own, per level (crossfades)

sfx.pauseMusic();  sfx.resumeMusic();    // pause with the game
sfx.duck(0.4, 0.5);                      // dip music under a big hit (auto on explosion)
sfx.musicVolume(0.4);                    // music volume, independent of SFX
sfx.stopMusic(0.5);

// A track is just an object:
var boss = {
  tempo: 150, stepsPerBeat: 4,
  voices: [
    { wave: 'square',   vol: 0.26, notes: 'C5 C#5 C5 C#5 C5 - G5 - G#5 G5 G#5 G5 - - F5 -' },
    { wave: 'sawtooth', vol: 0.30, notes: 'C3 . C3 . C3 . C3 . G#2 . G#2 . G2 . G2 .' }
  ]
};
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

### Arcade physics + tile grid

Bodies integrate gravity/friction and resolve against static rects. A grid turns
your level into those rects for free:

```js
var grid = Retroix.grid(40, 30, 16);      // 40×30 tiles, 16px each
grid.set(5, 20, 1);                        // 1 = solid

var hero = Retroix.physics.body({ x: 80, y: 40, w: 12, h: 16, gravity: 0.6, friction: 0.2, maxVx: 4, maxVy: 12 });

Retroix.loop(function (dt) {
  var a = input.axis();
  hero.vx = a.x * 4;
  if (input.down('up') && hero.onGround) { hero.vy = -11; sfx.jump(); }

  var solids = grid.solids(null, { x: hero.x - 40, y: hero.y - 40, w: 120, h: 120 }); // only nearby tiles
  Retroix.physics.move(hero, solids, dt);
  // hero.onGround / hero.blocked.left|right|up|down are now set for this frame
}).start();
```

> Cap velocity (`maxVx`/`maxVy`) below your tile size — arcade physics steps
> discretely, so an uncapped body can skip clean over a thin wall.

### Camera, state machine & tweens

```js
var cam = Retroix.camera(view, { bounds: { x: 0, y: 0, w: 640, h: 480 } });
cam.follow(hero, 0.1);                      // smooth follow
cam.begin(ctx); drawWorld(ctx); cam.end(ctx);

var game = Retroix.fsm({
  title: { enter: function () { showScreen('title'); } },
  play:  { update: function (dt) { stepWorld(dt); } },
  over:  { enter: function () { sfx.jingle('gameover'); } }
}, 'title');
// game.set('play'); game.update(dt); if (game.is('play')) { … }

var tm = Retroix.timer();
tm.tween(hero, { y: hero.y - 20 }, 0.3, 'outBack');   // little hop
tm.after(1.5, function () { game.set('over'); });
// in the loop: tm.update(dt);
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
