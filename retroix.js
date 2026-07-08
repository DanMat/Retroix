/*!
 * Retroix — a tiny, dependency-free retro arcade game engine.
 * https://github.com/DanMat/Retroix   MIT License.
 *
 * Extracted from a family of vanilla-JS arcade games. Gives you the parts every
 * one of them needs — a DPI-aware canvas, a render-safe game loop, keyboard /
 * mouse / touch input, a Supabase-or-localStorage leaderboard, overlay screens
 * with retro 3-initial high-score entry, and drawing helpers — so a game is
 * just its own update()/render() and level data.
 *
 * UMD: works as a <script> global (window.Retroix) or via import/require.
 */
(function (root, factory) {
	if (typeof module === 'object' && module.exports) { module.exports = factory(); }
	else { root.Retroix = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
	'use strict';

	var Retroix = { version: '0.1.0' };

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

	return Retroix;
});
