/*!
 * Retroix — a tiny, dependency-free retro arcade game engine.
 * https://github.com/DanMat/Retroix   MIT License.
 *
 * Extracted from a family of vanilla-JS arcade games. Gives you the parts every
 * one of them needs — a DPI-aware canvas, a render-safe game loop, keyboard /
 * mouse / touch input, a Supabase-or-localStorage leaderboard, overlay screens
 * with retro 3-initial high-score entry, drawing helpers, synthesized 8-bit
 * sound, screen-shake/flash/freeze game-feel, collision tests, and namespaced
 * storage — so a game is just its own update()/render() and level data.
 *
 * UMD: works as a <script> global (window.Retroix) or via import/require.
 */
(function (root, factory) {
	if (typeof module === 'object' && module.exports) { module.exports = factory(); }
	else { root.Retroix = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
	'use strict';

	var Retroix = { version: '0.2.0' };

	/* ------------------------------- util --------------------------------- */

	var util = {
		clamp: function (v, a, b) { return v < a ? a : v > b ? b : v; },
		rand: function (a, b) { return a + Math.random() * (b - a); },
		randInt: function (a, b) { return (a + Math.random() * (b - a + 1)) | 0; },
		pick: function (arr) { return arr[(Math.random() * arr.length) | 0]; },
		hypot: function (x, y) { return Math.sqrt(x * x + y * y); },
		dist2: function (ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; },
		lerp: function (a, b, t) { return a + (b - a) * t; },
		shuffle: function (a) { for (var i = a.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, t = a[i]; a[i] = a[j]; a[j] = t; } return a; },
		escapeHtml: function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
	};
	Retroix.util = util;

	/* ------------------------------ canvas -------------------------------- */

	// DPI-aware canvas: a fixed logical resolution scaled crisply to the element.
	Retroix.canvas = function (el, w, h) {
		var canvas = typeof el === 'string' ? document.querySelector(el) : el;
		var ctx = canvas.getContext('2d');
		var api = { canvas: canvas, ctx: ctx, width: w, height: h, dpr: 1 };
		api.resize = function () {
			var dpr = Math.min(window.devicePixelRatio || 1, 2);
			api.dpr = dpr; canvas.width = w * dpr; canvas.height = h * dpr;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		};
		// Client coords -> logical game coords.
		api.toLogical = function (clientX, clientY) {
			var r = canvas.getBoundingClientRect();
			return { x: (clientX - r.left) / r.width * w, y: (clientY - r.top) / r.height * h };
		};
		api.resize();
		window.addEventListener('resize', api.resize);
		return api;
	};

	/* ------------------------------- loop --------------------------------- */

	// requestAnimationFrame loop with a clamped delta. `step(dt)` gets seconds.
	// Render-safe by design: nothing runs until you start(), and stop() cancels
	// cleanly, so a loop can never die mid-frame and fail to reschedule.
	Retroix.loop = function (step, opts) {
		opts = opts || {};
		var raf = null, last = 0, running = false, maxDt = opts.maxDt || 0.05;
		function frame(now) {
			if (!running) { return; }
			var dt = Math.min((now - last) / 1000, maxDt);
			last = now;
			step(dt);
			raf = requestAnimationFrame(frame);
		}
		return {
			start: function () { if (running) { return; } running = true; last = performance.now(); raf = requestAnimationFrame(frame); },
			stop: function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
			isRunning: function () { return running; }
		};
	};

	/* ------------------------------- input -------------------------------- */

	// Keyboard (arrows + WASD, mapped to named actions) plus pointer (mouse and
	// touch) reported in logical coordinates. Read `input.actions` / `input.pointer`
	// each frame, or `input.axis()` for 8-way movement.
	Retroix.input = function (canvasApi, opts) {
		opts = opts || {};
		var actions = {}, raw = {}, pointer = { x: null, y: null, down: false, inside: false, moved: false };
		var MAP = {
			ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
			w: 'up', s: 'down', a: 'left', d: 'right',
			' ': 'action', Enter: 'confirm', Escape: 'pause', p: 'pause'
		};
		function norm(k) { return k.length === 1 ? k.toLowerCase() : k; }
		var handlers = { keydown: [], keyup: [] };

		document.addEventListener('keydown', function (e) {
			var k = norm(e.key); raw[k] = true; if (MAP[e.key] || MAP[k]) { actions[MAP[e.key] || MAP[k]] = true; }
			handlers.keydown.forEach(function (fn) { fn(e); });
			if (opts.preventArrows !== false && /^Arrow| $/.test(e.key)) { e.preventDefault(); }
		});
		document.addEventListener('keyup', function (e) {
			var k = norm(e.key); raw[k] = false; if (MAP[e.key] || MAP[k]) { actions[MAP[e.key] || MAP[k]] = false; }
			handlers.keyup.forEach(function (fn) { fn(e); });
		});

		if (canvasApi) {
			var c = canvasApi.canvas;
			c.addEventListener('mousemove', function (e) { var p = canvasApi.toLogical(e.clientX, e.clientY); pointer.x = p.x; pointer.y = p.y; pointer.inside = true; pointer.moved = true; });
			c.addEventListener('mouseleave', function () { pointer.inside = false; });
			c.addEventListener('mousedown', function () { pointer.down = true; });
			c.addEventListener('mouseup', function () { pointer.down = false; });
			function touch(e) { var t = e.touches[0]; if (t) { var p = canvasApi.toLogical(t.clientX, t.clientY); pointer.x = p.x; pointer.y = p.y; pointer.inside = true; pointer.down = true; pointer.moved = true; } e.preventDefault(); }
			c.addEventListener('touchstart', touch, { passive: false });
			c.addEventListener('touchmove', touch, { passive: false });
			c.addEventListener('touchend', function () { pointer.down = false; });
		}

		return {
			actions: actions, raw: raw, pointer: pointer,
			down: function (a) { return !!actions[a] || !!raw[a]; },
			axis: function () {
				return { x: (actions.right ? 1 : 0) - (actions.left ? 1 : 0), y: (actions.down ? 1 : 0) - (actions.up ? 1 : 0) };
			},
			onKeyDown: function (fn) { handlers.keydown.push(fn); },
			onKeyUp: function (fn) { handlers.keyup.push(fn); }
		};
	};

	/* ----------------------------- leaderboard ---------------------------- */

	// Shared high-score store. Pass { supabaseUrl, supabaseAnonKey, gameId, size }
	// (or leave the Supabase fields blank for a local, per-browser board).
	Retroix.leaderboard = function (cfg) {
		cfg = cfg || {};
		var GAME = cfg.gameId || 'game', SIZE = cfg.size || cfg.leaderboardSize || 10;
		var useSb = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);
		var LOCAL = 'leaderboard-' + GAME;

		function headers(extra) { var h = { apikey: cfg.supabaseAnonKey, Authorization: 'Bearer ' + cfg.supabaseAnonKey }; for (var k in extra) { h[k] = extra[k]; } return h; }
		function sbTop(limit) {
			var url = cfg.supabaseUrl.replace(/\/$/, '') + '/rest/v1/scores?game=eq.' + encodeURIComponent(GAME) +
				'&select=initials,score,stage,created_at&order=score.desc,created_at.asc&limit=' + limit;
			return fetch(url, { headers: headers() }).then(function (r) { if (!r.ok) { throw new Error(r.status); } return r.json(); });
		}
		function sbSubmit(entry) {
			return fetch(cfg.supabaseUrl.replace(/\/$/, '') + '/rest/v1/scores', {
				method: 'POST', headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }), body: JSON.stringify(entry)
			}).then(function (r) { if (!r.ok) { throw new Error(r.status); } return entry; });
		}
		function localAll() { try { return JSON.parse(localStorage.getItem(LOCAL)) || []; } catch (e) { return []; } }
		function localTop(limit) { return Promise.resolve(localAll().sort(function (a, b) { return b.score - a.score; }).slice(0, limit)); }
		function localSubmit(entry) { var r = localAll(); r.push(entry); r.sort(function (a, b) { return b.score - a.score; }); r = r.slice(0, 100); try { localStorage.setItem(LOCAL, JSON.stringify(r)); } catch (e) {} return Promise.resolve(entry); }

		function top(limit) { limit = limit || SIZE; return useSb ? sbTop(limit).catch(function () { return localTop(limit); }) : localTop(limit); }
		function submit(initials, score, stage) {
			var entry = { game: GAME, initials: String(initials).toUpperCase().slice(0, 3), score: Math.max(0, Math.floor(score)), stage: stage || 1, created_at: new Date().toISOString() };
			return useSb ? sbSubmit(entry).catch(function () { return localSubmit(entry); }) : localSubmit(entry);
		}
		function qualifies(score, limit) { limit = limit || SIZE; if (score <= 0) { return Promise.resolve(false); } return top(limit).then(function (rows) { return rows.length < limit || score > rows[rows.length - 1].score; }); }

		return { top: top, submit: submit, qualifies: qualifies, mode: useSb ? 'supabase' : 'local' };
	};

	/* ------------------------------ screens ------------------------------- */

	// Overlay manager: elements with a `data-screen="id"` attribute are shown one
	// at a time (the rest get `hidden`). The [hidden] attribute must win over
	// display in your CSS — retroix.css handles that for `.rx-screen`.
	Retroix.screens = function (rootEl) {
		var root = typeof rootEl === 'string' ? document.querySelector(rootEl) : (rootEl || document);
		var list = [].slice.call(root.querySelectorAll('[data-screen]'));
		var map = {}; list.forEach(function (el) { map[el.getAttribute('data-screen')] = el; });
		return {
			el: map,
			show: function (id) { list.forEach(function (el) { el.hidden = (el.getAttribute('data-screen') !== id); }); return map[id]; },
			hideAll: function () { list.forEach(function (el) { el.hidden = true; }); },
			current: function () { for (var i = 0; i < list.length; i++) { if (!list[i].hidden) { return list[i].getAttribute('data-screen'); } } return null; }
		};
	};

	/* --------------------------- initials entry --------------------------- */

	// Retro 3-letter high-score entry. Renders into `container` (which should
	// contain `.rx-slots` markup, or one is created), wires keyboard + ▲▼, and
	// calls opts.onEnter(initials) on submit.
	Retroix.initials = function (container, opts) {
		opts = opts || {};
		var el = typeof container === 'string' ? document.querySelector(container) : container;
		var len = opts.length || 3, slots = [], cursor = 0, chars = [];
		for (var i = 0; i < len; i++) { chars.push('A'); }

		var wrap = el.querySelector('.rx-slots');
		if (!wrap) { wrap = document.createElement('div'); wrap.className = 'rx-slots'; el.appendChild(wrap); }
		wrap.innerHTML = '';
		for (i = 0; i < len; i++) {
			var s = document.createElement('div'); s.className = 'rx-slot';
			s.innerHTML = '<button class="rx-slot-up" aria-label="up">▲</button><span class="rx-slot-ch">A</span><button class="rx-slot-down" aria-label="down">▼</button>';
			(function (idx, node) {
				node.querySelector('.rx-slot-up').addEventListener('click', function () { cycle(idx, 1); });
				node.querySelector('.rx-slot-down').addEventListener('click', function () { cycle(idx, -1); });
				node.addEventListener('click', function (e) { if (!e.target.closest('button')) { cursor = idx; render(); } });
			})(i, s);
			wrap.appendChild(s); slots.push(s);
		}
		function render() { slots.forEach(function (s, i) { s.querySelector('.rx-slot-ch').textContent = chars[i]; s.classList.toggle('rx-slot--active', i === cursor); }); }
		function cycle(i, d) { var c = (chars[i].charCodeAt(0) - 65 + d + 26) % 26; chars[i] = String.fromCharCode(65 + c); cursor = i; render(); }
		function key(e) {
			var k = e.key;
			if (/^[a-zA-Z]$/.test(k)) { chars[cursor] = k.toUpperCase(); if (cursor < len - 1) { cursor++; } render(); }
			else if (k === 'ArrowUp') { cycle(cursor, 1); }
			else if (k === 'ArrowDown') { cycle(cursor, -1); }
			else if (k === 'ArrowLeft') { cursor = Math.max(0, cursor - 1); render(); }
			else if (k === 'ArrowRight') { cursor = Math.min(len - 1, cursor + 1); render(); }
			else if (k === 'Backspace') { cursor = Math.max(0, cursor - 1); render(); }
			else if (k === 'Enter') { if (opts.onEnter) { opts.onEnter(value()); } }
			else { return; }
			e.preventDefault();
		}
		function value() { return chars.join(''); }
		var api = {
			value: value,
			reset: function () { for (var i = 0; i < len; i++) { chars[i] = 'A'; } cursor = 0; render(); return api; },
			handleKey: key,           // call this from your keydown handler while active
			bindKeys: function () { document.addEventListener('keydown', keyGuard); return api; },
			active: false
		};
		function keyGuard(e) { if (api.active) { key(e); } }
		render();
		return api;
	};

	/* --------------------------- leaderboard UI --------------------------- */

	// Render score rows into a <tbody>. opts: { highlightInitials, highlightScore,
	// columns: ['rank','initials','score','stage'], emptyText, loadingText }.
	Retroix.renderLeaderboard = function (tbody, rows, opts) {
		opts = opts || {};
		var cols = opts.columns || ['rank', 'initials', 'score', 'stage'];
		if (!rows) { tbody.innerHTML = '<tr><td colspan="' + cols.length + '" class="rx-lb-msg">' + (opts.loadingText || 'Loading…') + '</td></tr>'; return; }
		if (!rows.length) { tbody.innerHTML = '<tr><td colspan="' + cols.length + '" class="rx-lb-msg">' + (opts.emptyText || 'No scores yet — be the first!') + '</td></tr>'; return; }
		var used = false;
		tbody.innerHTML = rows.map(function (row, i) {
			var me = !used && opts.highlightInitials && row.initials === opts.highlightInitials && (opts.highlightScore == null || row.score === opts.highlightScore);
			if (me) { used = true; }
			var tds = cols.map(function (c) {
				if (c === 'rank') { return '<td>' + (i + 1) + '</td>'; }
				if (c === 'initials') { return '<td class="rx-lb-ini">' + util.escapeHtml(row.initials) + '</td>'; }
				if (c === 'score') { return '<td class="rx-lb-score">' + Number(row.score).toLocaleString() + '</td>'; }
				if (c === 'stage') { return '<td>' + (row.stage || '-') + '</td>'; }
				return '<td>' + util.escapeHtml(String(row[c] == null ? '' : row[c])) + '</td>';
			}).join('');
			return '<tr' + (me ? ' class="rx-lb-me"' : '') + '>' + tds + '</tr>';
		}).join('');
	};

	/* -------------------------------- gfx --------------------------------- */

	var gfx = {
		roundRect: function (ctx, x, y, w, h, r) {
			ctx.beginPath(); ctx.moveTo(x + r, y);
			ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
			ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
		},
		// A minimal particle burst system. emit() then update(dt)+render(ctx) each frame.
		particles: function () {
			var list = [];
			return {
				list: list,
				emit: function (x, y, color, n, spread) {
					spread = spread || 4;
					for (var i = 0; i < (n || 8); i++) { list.push({ x: x, y: y, vx: util.rand(-spread, spread), vy: util.rand(-spread, spread), life: 1, color: color }); }
				},
				update: function (dt) {
					var f = dt * 60;
					for (var i = list.length - 1; i >= 0; i--) { var p = list[i]; p.x += p.vx * f; p.y += p.vy * f; p.vx *= 0.92; p.vy *= 0.92; p.life -= dt * 2; if (p.life <= 0) { list.splice(i, 1); } }
				},
				render: function (ctx) {
					for (var i = 0; i < list.length; i++) { var p = list[i]; ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); } ctx.globalAlpha = 1;
				},
				clear: function () { list.length = 0; }
			};
		}
	};
	Retroix.gfx = gfx;

	/* ------------------------------- toast -------------------------------- */

	// Fading center message. Pass the toast element (styled by retroix.css).
	Retroix.toast = function (el) {
		var timer;
		return function (msg, ms) { el.textContent = msg; el.classList.add('rx-toast--show'); clearTimeout(timer); timer = setTimeout(function () { el.classList.remove('rx-toast--show'); }, ms || 1400); };
	};

	/* ------------------------------- audio -------------------------------- */

	// 8-bit sound with zero sample files — everything is synthesized on the Web
	// Audio API. `var sfx = Retroix.audio();` then sfx.coin() / sfx.explosion(),
	// sfx.play('laser'), sfx.jingle('win'), or sfx.tone({ ... }) for a custom
	// blip. Browsers block audio until a user gesture, so the first key or tap
	// auto-unlocks it. Mute/volume persist in localStorage by default.
	var A4 = 440, SEMI = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
	function noteFreq(n) {
		if (typeof n === 'number') { return n; }
		var m = /^([A-Ga-g])([#b]?)(-?\d)$/.exec(n);
		if (!m) { return 440; }
		var s = SEMI[m[1].toUpperCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (parseInt(m[3], 10) - 4) * 12;
		return A4 * Math.pow(2, s / 12);
	}
	function mergeObj(a, b) { var o = {}, k; for (k in a) { o[k] = a[k]; } for (k in b) { o[k] = b[k]; } return o; }

	Retroix.audio = function (opts) {
		opts = opts || {};
		var AC = window.AudioContext || window.webkitAudioContext;
		var STORE = 'rx-audio', persist = opts.persist !== false, saved = {};
		if (persist) { try { saved = JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) {} }
		var vol = saved.volume != null ? saved.volume : (opts.volume != null ? opts.volume : 0.35);
		var isMuted = saved.muted != null ? saved.muted : !!opts.muted;
		var ctx = null, master = null, noiseBuf = null;

		function ensure() {
			if (!AC) { return false; }
			if (!ctx) { ctx = new AC(); master = ctx.createGain(); master.gain.value = isMuted ? 0 : vol; master.connect(ctx.destination); }
			if (ctx.state === 'suspended') { ctx.resume(); }
			return true;
		}
		function save() { if (persist) { try { localStorage.setItem(STORE, JSON.stringify({ volume: vol, muted: isMuted })); } catch (e) {} } }
		function noiseSource() {
			if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, (ctx.sampleRate * 0.5) | 0, ctx.sampleRate); var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) { d[i] = Math.random() * 2 - 1; } }
			var s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; return s;
		}

		// One tone/blip. spec: { wave, freq, freqEnd, dur, attack, release, vol,
		// type:'noise', filter } — freqEnd slides the pitch (jump/laser/hit).
		function tone(spec, when) {
			if (!ensure()) { return 0; }
			spec = spec || {};
			var t0 = when != null ? when : ctx.currentTime;
			var dur = spec.dur || 0.12, atk = spec.attack != null ? spec.attack : 0.005;
			var rel = spec.release != null ? spec.release : Math.min(0.08, dur * 0.5);
			var peak = Math.max(0.0001, (spec.vol != null ? spec.vol : 1));
			var g = ctx.createGain();
			g.gain.setValueAtTime(0.0001, t0);
			g.gain.exponentialRampToValueAtTime(peak, t0 + atk);
			g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
			var src;
			if (spec.type === 'noise') {
				src = noiseSource();
				if (spec.filter !== false) {
					var flt = ctx.createBiquadFilter(); flt.type = 'lowpass';
					flt.frequency.setValueAtTime(spec.filter || 1800, t0);
					flt.frequency.exponentialRampToValueAtTime(200, t0 + dur);
					src.connect(flt); flt.connect(g);
				} else { src.connect(g); }
			} else {
				var osc = ctx.createOscillator(); osc.type = spec.wave || 'square';
				osc.frequency.setValueAtTime(noteFreq(spec.freq || 440), t0);
				if (spec.freqEnd) { osc.frequency.exponentialRampToValueAtTime(Math.max(1, noteFreq(spec.freqEnd)), t0 + dur); }
				osc.connect(g); src = osc;
			}
			g.connect(master);
			src.start(t0); src.stop(t0 + dur + rel);
			return dur;
		}

		// Notes back-to-back. `notes` is [{ freq, dur, wave }] or shorthand
		// strings like 'C5:0.1' / 'E5' (dur falls back to common.dur). Returns
		// the total length in seconds.
		function sequence(notes, common) {
			if (!ensure()) { return 0; }
			common = common || {};
			var t = ctx.currentTime, gap = common.gap || 0, start = t;
			for (var i = 0; i < notes.length; i++) {
				var n = notes[i], spec;
				if (typeof n === 'string') { var p = n.split(':'); spec = mergeObj(common, { freq: p[0], dur: p[1] ? +p[1] : (common.dur || 0.12) }); }
				else { spec = mergeObj(common, n); }
				tone(spec, t);
				t += (spec.dur || 0.12) + gap;
			}
			return t - start;
		}

		var SFX = {
			blip: function () { tone({ wave: 'square', freq: 880, dur: 0.06, vol: 0.7 }); },
			select: function () { tone({ wave: 'square', freq: 660, freqEnd: 990, dur: 0.08, vol: 0.7 }); },
			coin: function () { sequence(['B5:0.07', 'E6:0.16'], { wave: 'square', vol: 0.7 }); },
			jump: function () { tone({ wave: 'square', freq: 220, freqEnd: 660, dur: 0.16, vol: 0.7 }); },
			laser: function () { tone({ wave: 'sawtooth', freq: 900, freqEnd: 120, dur: 0.2, vol: 0.6 }); },
			powerup: function () { sequence(['C5:0.06', 'E5:0.06', 'G5:0.06', 'C6:0.14'], { wave: 'square', vol: 0.6 }); },
			hit: function () { tone({ type: 'noise', dur: 0.12, filter: 1200, vol: 0.7 }); tone({ wave: 'square', freq: 160, freqEnd: 80, dur: 0.12, vol: 0.5 }); },
			explosion: function () { tone({ type: 'noise', dur: 0.5, filter: 900, vol: 0.9 }); }
		};
		var JINGLES = {
			win: ['C5:0.12', 'E5:0.12', 'G5:0.12', 'C6:0.3'],
			lose: ['G4:0.14', 'E4:0.14', 'C4:0.36'],
			levelup: ['E5:0.1', 'G5:0.1', 'C6:0.1', 'E6:0.28'],
			gameover: ['C5:0.18', 'G4:0.18', 'E4:0.18', 'C4:0.42']
		};

		var api = {
			ctx: function () { return ctx; },
			tone: tone, sequence: sequence,
			play: function (name, o) { if (SFX[name]) { SFX[name](); } else { tone(mergeObj({ freq: name }, o || {})); } return api; },
			jingle: function (name, common) { var j = JINGLES[name]; if (j) { sequence(j, mergeObj({ wave: 'square', vol: 0.6 }, common || {})); } return api; },
			unlock: function () { ensure(); return api; },
			muted: function () { return isMuted; },
			mute: function (v) { isMuted = v == null ? true : !!v; if (master) { master.gain.value = isMuted ? 0 : vol; } save(); return api; },
			toggle: function () { return api.mute(!isMuted); },
			volume: function (v) { if (v == null) { return vol; } vol = util.clamp(+v, 0, 1); if (master && !isMuted) { master.gain.value = vol; } save(); return api; },
			sfx: SFX, jingles: JINGLES, noteFreq: noteFreq
		};
		// Direct helpers: sfx.coin(), sfx.explosion(), … each returns api.
		Object.keys(SFX).forEach(function (k) { api[k] = function () { SFX[k](); return api; }; });
		// First user gesture unlocks the audio context (browser autoplay policy).
		function unlock() { ensure(); }
		['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, unlock, { once: true }); });
		return api;
	};

	/* -------------------------------- fx ---------------------------------- */

	// Game feel: screen shake, a full-screen flash, and freeze-frame (hitstop).
	//   var fx = Retroix.fx(view);            // pass the canvas api or {width,height}
	//   fx.update(dt); if (!fx.frozen()) { updateWorld(dt); }
	//   fx.preRender(ctx); drawWorld(); fx.postRender(ctx);
	Retroix.fx = function (dims, opts) {
		opts = opts || {};
		var W = dims.width, H = dims.height;
		var maxShake = opts.maxShake || 14, decay = opts.decay || 1.4, flashTime = opts.flashTime || 0.25;
		var trauma = 0, sx = 0, sy = 0, flashColor = '#fff', flashA = 0, flashDecay = 0, freezeT = 0;
		return {
			// Add shake. amount 0..1 (~0.3 a bump, ~0.7 a big hit); stacks, capped.
			shake: function (amount) { trauma = util.clamp(trauma + (amount == null ? 0.5 : amount), 0, 1); },
			// Flash the screen: flash('#fff', 0.6) or flash('#f22').
			flash: function (color, strength) { flashColor = color || '#fff'; flashA = strength == null ? 0.6 : strength; flashDecay = flashA / flashTime; },
			// Freeze the world for `dur` seconds; gate your updates with frozen().
			freeze: function (dur) { freezeT = Math.max(freezeT, dur == null ? 0.06 : dur); },
			frozen: function () { return freezeT > 0; },
			trauma: function () { return trauma; },
			update: function (dt) {
				if (freezeT > 0) { freezeT -= dt; }
				if (trauma > 0) { trauma = Math.max(0, trauma - decay * dt); var m = maxShake * trauma * trauma; sx = util.rand(-m, m); sy = util.rand(-m, m); }
				else { sx = sy = 0; }
				if (flashA > 0) { flashA = Math.max(0, flashA - flashDecay * dt); }
			},
			// Wrap your world drawing between these two.
			preRender: function (ctx) { ctx.save(); ctx.translate(sx, sy); },
			postRender: function (ctx) { ctx.restore(); if (flashA > 0) { ctx.save(); ctx.globalAlpha = flashA; ctx.fillStyle = flashColor; ctx.fillRect(0, 0, W, H); ctx.restore(); } }
		};
	};

	/* -------------------------------- hit --------------------------------- */

	// Overlap tests. Rects are { x, y, w, h } (top-left); circles are { x, y, r }.
	Retroix.hit = {
		rects: function (a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; },
		circles: function (a, b) { var dx = a.x - b.x, dy = a.y - b.y, r = a.r + b.r; return dx * dx + dy * dy < r * r; },
		circleRect: function (c, r) { var nx = util.clamp(c.x, r.x, r.x + r.w), ny = util.clamp(c.y, r.y, r.y + r.h), dx = c.x - nx, dy = c.y - ny; return dx * dx + dy * dy < c.r * c.r; },
		pointRect: function (px, py, r) { return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h; },
		pointCircle: function (px, py, c) { var dx = px - c.x, dy = py - c.y; return dx * dx + dy * dy < c.r * c.r; }
	};

	/* ------------------------------ storage ------------------------------- */

	// Namespaced, JSON-friendly localStorage. var store = Retroix.storage('paddix');
	// store.set('best', 1200); store.get('muted', false). No-ops if storage is blocked.
	Retroix.storage = function (ns) {
		var P = 'rx:' + (ns || 'game') + ':';
		function safe(fn, d) { try { return fn(); } catch (e) { return d; } }
		var store = {
			get: function (key, fallback) { var d = fallback == null ? null : fallback; return safe(function () { var v = localStorage.getItem(P + key); return v == null ? d : JSON.parse(v); }, d); },
			set: function (key, val) { safe(function () { localStorage.setItem(P + key, JSON.stringify(val)); }); return val; },
			remove: function (key) { safe(function () { localStorage.removeItem(P + key); }); },
			keys: function () { return safe(function () { var out = []; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf(P) === 0) { out.push(k.slice(P.length)); } } return out; }, []); },
			clear: function () { store.keys().forEach(function (k) { store.remove(k); }); }
		};
		return store;
	};

	return Retroix;
});
