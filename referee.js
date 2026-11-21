'use strict';
/* داور سرور جنگ‌سالار
   همان منطق بازی را که داخل index.html است (بدون گرافیک و صدا) روی سرور اجرا می‌کند.
   هر دستوری که سرور به بازیکن‌ها می‌فرستد، همزمان روی این نسخه هم اعمال می‌شود؛
   پس سرور خودش می‌داند وضعیت واقعی بازی چیست و چه کسی برده است.
   چون منطق مستقیم از index.html خوانده می‌شود، هر تغییری در قوانین بازی خودکار روی سرور هم اعمال می‌شود. */
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const HTML = process.env.REF_HTML || path.join(__dirname, 'index.html');
const MAX_SIMS = Math.max(1, parseInt(process.env.REF_MAX, 10) || 60);
const STALE_MS = 20 * 60 * 1000;

let compiled = null, loadErr = null, triedAt = 0;
function compile() {
  if (compiled) return compiled;
  if (loadErr && Date.now() - triedAt < 60000) return null;
  triedAt = Date.now();
  try {
    const html = fs.readFileSync(HTML, 'utf8');
    const re = /<script>([\s\S]*?)<\/script>/g;
    let m, code = null;
    while ((m = re.exec(html))) {
      if (m[1].includes('function apply0(') && m[1].includes('function stHash(')) { code = m[1]; break; }
    }
    if (!code) throw new Error('اسکریپت منطق بازی در index.html پیدا نشد');
    compiled = new vm.Script(code, { filename: 'game-logic.js' });
    loadErr = null;
  } catch (e) {
    loadErr = e; compiled = null;
    console.error('referee: بارگذاری منطق بازی ناموفق بود:', e.message);
  }
  return compiled;
}

// شیء ساختگی: هر چیزی که منطق بازی از بخش گرافیک/مرورگر بخواهد جواب می‌دهد و هیچ کاری نمی‌کند
function mkStub() {
  const f = function () {};
  const p = new Proxy(f, {
    get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'length' ? 0 : k === 'then' ? () => p : p),
    apply: () => p,
    construct: () => p,
    set: () => true,
  });
  return p;
}

// بعد از بارگذاری اجرا می‌شود: جایگزین بخش‌هایی که به گرافیک وابسته‌اند
const PATCH = `
renderer = null;
castOk = function (c) {
  const S = SPELLS[c.k];
  if (!S || !S.t || !Number.isInteger(c.x) || !Number.isInteger(c.y) || !inb(c.x, c.y) || !Array.isArray(c.pt) || c.pt.length !== 3 || !c.pt.every(Number.isFinite) || !Array.isArray(c.cells) || c.cells.length > COLS * ROWS) return false;
  try { return JSON.stringify(cellsFor(S.t, c.x, c.y, { x: c.pt[0], y: c.pt[1], z: c.pt[2] })) === JSON.stringify(c.cells); } catch (_) { return false; }
};
function __feed(c) {
  if (c.a === 'init') { ONLINE = true; MATCH = true; ME = 2; LOBBY = false; CONN = true; AUTHED = true; BOTG = false; OFFG = false; }
  apply(c);
}
function __state() {
  const lo = (typeof U !== 'undefined' && U) ? [0, 1].find(o => !U.some(u => u.o === o && !(u.k in SMN))) : undefined;
  return { ov: !!over, lk: LOCK | 0, h: stHash(), lo: lo === undefined ? -9 : lo };
}
`;

const sims = new Set();

function create() {
  const script = compile();
  if (!script) return null;
  const now = Date.now();
  for (const s of sims) if (now - s.last > STALE_MS) s.dispose();
  if (sims.size >= MAX_SIMS) return null;

  // ساعت مجازی: انیمیشن‌ها و تایمرهای بازی (مثلاً توپ آتشین) بدون انتظار واقعی اجرا می‌شوند
  let vnow = 1.7e12, seq = 0;
  const timers = new Map();
  const st = (fn, ms) => {
    if (typeof fn !== 'function') return 0;
    const id = ++seq;
    timers.set(id, { id, t: vnow + Math.max(0, +ms || 0), fn });
    return id;
  };
  const drain = () => {
    let n = 0;
    while (timers.size) {
      if (++n > 40000) { timers.clear(); return false; }
      let b = null;
      for (const t of timers.values()) if (!b || t.t < b.t || (t.t === b.t && t.id < b.id)) b = t;
      timers.delete(b.id);
      if (b.t > vnow) vnow = b.t;
      try { b.fn(vnow); } catch (_) { /* خطای بخش گرافیکی مهم نیست */ }
    }
    return true;
  };
  const stub = mkStub();
  class VDate extends Date {
    constructor(...a) { if (a.length) super(...a); else super(vnow); }
    static now() { return vnow; }
  }
  const ctx = {
    console: { log() {}, error() {}, warn() {}, info() {} },
    Math, JSON, Date: VDate, Map, Set, WeakMap, Float32Array, Uint8Array, URLSearchParams,
    performance: { now: () => vnow },
    setTimeout: st, clearTimeout: id => timers.delete(id),
    setInterval: () => 0, clearInterval() {},
    requestAnimationFrame: fn => (typeof fn === 'function' && fn.name === 'loop' ? 0 : st(() => fn(vnow), 16)),   // حلقهٔ رسم گرافیک بی‌پایان است و لازم نیست cancelAnimationFrame: id => timers.delete(id),
    THREE: stub, document: stub, navigator: {}, screen: {}, Image: function () {}, WebSocket: function () {},
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    sessionStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    location: { search: '', protocol: 'http:', host: 'x', hostname: 'x', href: 'http://x/' },
    addEventListener() {}, removeEventListener() {},
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    getComputedStyle: () => stub,
    devicePixelRatio: 1, innerWidth: 400, innerHeight: 800, AudioContext: undefined,
  };
  ctx.window = ctx; ctx.self = ctx;
  vm.createContext(ctx);

  const sim = {
    broken: false, why: '', over: false, winner: -1, hs: [], last: now,
    feed(c, n) {
      if (this.broken) return;
      this.last = Date.now();
      try {
        ctx.__s = JSON.stringify(c);
        vm.runInContext('__feed(JSON.parse(__s))', ctx, { timeout: 3000 });
        if (!drain()) throw new Error('تایمرهای بازی تمام نشد');
        const r = vm.runInContext('__state()', ctx, { timeout: 1000 });
        if (r.lk && !r.ov) throw new Error('بازی روی انیمیشن/احضار گیر کرد');
        this.hs[n] = r.h | 0;
        this.over = !!r.ov;
        this.winner = r.ov ? (r.lo === -9 ? -1 : 1 - r.lo) : -1;
      } catch (e) {
        this.broken = true; this.why = (e && e.message) || String(e);
      }
    },
    ev(code) { return vm.runInContext(code, ctx, { timeout: 3000 }); },   // فقط برای آزمایش
    drain,
    dispose() { timers.clear(); sims.delete(this); this.broken = true; },
  };
  try {
    script.runInContext(ctx, { timeout: 10000 });
    vm.runInContext(PATCH, ctx, { timeout: 2000 });
    drain();
  } catch (e) {
    console.error('referee: ساخت نسخهٔ بدون گرافیک ناموفق بود:', e && e.message);
    return null;
  }
  sims.add(sim);
  return sim;
}

module.exports = { create, count: () => sims.size };
