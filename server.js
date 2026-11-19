// سرور جنگ‌سالار: حساب کاربری، دوستی، دعوت به نبرد، و پخش دستورهای بازی بین دو نفر
// (منطق خود بازی در مرورگرهاست؛ سرور فقط دستورها را مرتب می‌کند و پخش می‌کند)
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const DATA = process.env.DATA_FILE || path.join(__dirname, 'data.json');

/* ---------- ذخیره‌سازی ----------
   اگر دو متغیر UPSTASH_REDIS_REST_URL و UPSTASH_REDIS_REST_TOKEN تنظیم شده باشند، حساب‌ها در دیتابیس
   رایگان Upstash ذخیره می‌شوند (دائمی، حتی بعد از خاموش/روشن شدن سرور). وگرنه در فایل data.json. */
const REDIS_URL = String(process.env.UPSTASH_REDIS_REST_URL || '').trim().replace(/\/+$/, '');
const REDIS_TOKEN = String(process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
const USE_REDIS = !!(REDIS_URL && REDIS_TOKEN);
const DB_KEY = 'jangsalar:db';
async function redis(cmd) {
  const r = await fetch(REDIS_URL, { method: 'POST', headers: { Authorization: 'Bearer ' + REDIS_TOKEN, 'content-type': 'application/json' }, body: JSON.stringify(cmd) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error || ('HTTP ' + r.status));
  return j.result;
}
let db = { users: {}, sessions: {} };
let saveT = 0, chain = Promise.resolve();
const persist = () => (chain = chain.then(async () => {
  const s = JSON.stringify(db);
  if (USE_REDIS) { try { await redis(['SET', DB_KEY, s]); } catch (e) { console.error('ذخیره در دیتابیس ناموفق:', e.message); } }
  else await new Promise(res => fs.writeFile(DATA + '.tmp', s, e => { if (e) return res(); fs.rename(DATA + '.tmp', DATA, () => res()); }));
}));
const save = () => { clearTimeout(saveT); saveT = setTimeout(persist, 300); };
async function loadDb() {
  if (USE_REDIS) {
    // اگر دیتابیس در دسترس نباشد، عمداً با دیتابیس خالی شروع نمی‌کنیم (تا حساب‌های قبلی رونویسی نشوند)
    for (let i = 0; ; i++) {
      try { const s = await redis(['GET', DB_KEY]); if (s) db = JSON.parse(s); console.log('دیتابیس Upstash وصل شد'); break; }
      catch (e) { console.error('خواندن دیتابیس ناموفق:', e.message); if (i >= 4) process.exit(1); await new Promise(r => setTimeout(r, 2000)); }
    }
  } else {
    try { db = JSON.parse(fs.readFileSync(DATA, 'utf8')); } catch {}
    console.log('هشدار: Upstash تنظیم نشده؛ حساب‌ها در data.json ذخیره می‌شوند (ممکن است پاک شوند)');
  }
  db.users = db.users || {}; db.sessions = db.sessions || {};
}
const flushAndExit = () => { clearTimeout(saveT); persist().then(() => process.exit(0)); };
process.on('SIGTERM', flushAndExit); process.on('SIGINT', flushAndExit);

/* ---------- HTTP: صفحهٔ بازی و عکس لودینگ ---------- */
const MIME = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
  const p = new URL(req.url, 'http://x').pathname;
  if (p === '/' || p === '/index.html') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
  }
  const m = /^\/loading(\.jpg|\.png|\.webp)$/.exec(p);
  if (m) {
    const f = path.join(__dirname, 'loading' + m[1]);
    if (fs.existsSync(f)) { res.writeHead(200, { 'content-type': MIME[m[1]], 'cache-control': 'public, max-age=300' }); return fs.createReadStream(f).pipe(res); }
  }
  if (p === '/entry.mp3') {                      // موزیک ورود (اختیاری): فایل entry.mp3 کنار server.js
    const f = path.join(__dirname, 'entry.mp3');
    if (fs.existsSync(f)) { res.writeHead(200, { 'content-type': 'audio/mpeg', 'cache-control': 'public, max-age=300' }); return fs.createReadStream(f).pipe(res); }
  }
  if (p === '/health') return res.end('ok');
  res.writeHead(404).end('not found');
});

/* ---------- وضعیت زنده (در حافظه) ---------- */
const conns = new Map();     // کلید کاربر -> websocket
const inMatch = new Map();   // کلید کاربر -> match
const invOut = new Map();    // دعوت‌کننده -> inv
const invIn = new Map();     // دعوت‌شونده -> inv

const key = n => String(n || '').trim().toLowerCase();
const nameOf = k => (db.users[k] ? db.users[k].name : k);
const send = (ws, o) => ws && ws.readyState === 1 && ws.send(JSON.stringify(o));
const sendU = (k, o) => send(conns.get(k), o);
const toast = (ws, msg) => send(ws, { t: 'toast', msg });
const seed = () => (Math.random() * 2147483647) | 0;
const hashPw = (p, salt) => crypto.scryptSync(p, salt, 32).toString('hex');

function pushFL(k) {
  const u = db.users[k]; if (!u || !conns.has(k)) return;
  sendU(k, { t: 'fl',
    friends: u.friends.map(f => ({ u: nameOf(f), on: conns.has(f), busy: inMatch.has(f) })),
    inc: u.inc.map(nameOf), out: u.out.map(nameOf) });
}
const pushFriendsOf = k => { const u = db.users[k]; if (u) u.friends.forEach(pushFL); };
const drop = (arr, v) => { const i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); };

/* ---------- ورود / ثبت‌نام ---------- */
function auth(ws, m) {
  const err = (msg, resume) => send(ws, { t: 'autherr', msg, resume });
  if (m.t === 'resume') {
    const k = key(m.u);
    if (db.sessions[m.tok] === k && db.users[k]) return login(ws, k, m.tok);
    return err('نشست منقضی شده؛ دوباره وارد شو.', true);
  }
  const name = String(m.u || '').trim(), pw = String(m.p || ''), k = key(name);
  if (++ws.tries > 12) return ws.close();
  if (!/^[\p{L}\p{N}_]{3,16}$/u.test(name)) return err('نام کاربری باید ۳ تا ۱۶ حرف یا عدد باشد');
  if (pw.length < 4 || pw.length > 64) return err('رمز باید حداقل ۴ کاراکتر باشد');
  if (m.mode === 'register') {
    if (db.users[k]) return err('این نام قبلاً گرفته شده');
    const salt = crypto.randomBytes(16).toString('hex');
    db.users[k] = { name, salt, hash: hashPw(pw, salt), friends: [], inc: [], out: [] };
  } else {
    const u = db.users[k];
    if (!u || !crypto.timingSafeEqual(Buffer.from(u.hash, 'hex'), Buffer.from(hashPw(pw, u.salt), 'hex')))
      return err('نام کاربری یا رمز اشتباه است');
  }
  const tok = crypto.randomBytes(24).toString('hex');
  db.sessions[tok] = k; save();
  login(ws, k, tok);
}
function login(ws, k, tok) {
  const old = conns.get(k);
  if (old && old !== ws) { old.u = null; send(old, { t: 'kicked' }); old.close(4001); }
  ws.u = k; ws.tok = tok; conns.set(k, ws);
  send(ws, { t: 'authok', u: nameOf(k), tok });
  pushFL(k); pushFriendsOf(k);
  const mt = inMatch.get(k); if (mt) resumeMatch(mt, k, ws);
}
function leaveSession(ws) {                  // خروج یا قطع اتصال
  const k = ws.u; if (!k || conns.get(k) !== ws) return;
  conns.delete(k); ws.u = null;
  if (invOut.has(k)) endInv(invOut.get(k), 'cancel');
  if (invIn.has(k)) endInv(invIn.get(k), 'offline');
  const mt = inMatch.get(k);
  if (mt) {
    const i = mt.p.indexOf(k);
    sendU(mt.p[1 - i], { t: 'opp', on: false });
    if (!mt.ended) mt.tmr[i] = setTimeout(() => {          // ۹۰ ثانیه فرصت بازگشت
      if (!conns.has(k) && inMatch.get(k) === mt && !mt.ended) abort(mt, 1 - i, i, 'disconnect');
    }, 90000);
  }
  pushFriendsOf(k);
}

/* ---------- دوستی ---------- */
function friends(ws, m) {
  const me = ws.u, U = db.users[me], t = key(m.u), T = db.users[t];
  if (m.t === 'fadd') {
    if (!T) return toast(ws, 'کاربری با این نام پیدا نشد');
    if (t === me) return toast(ws, 'نمی‌توانی خودت را اضافه کنی');
    if (U.friends.includes(t)) return toast(ws, 'از قبل دوست هستید');
    if (U.out.includes(t)) return toast(ws, 'درخواست قبلاً فرستاده شده');
    if (U.inc.includes(t)) { drop(U.inc, t); drop(T.out, me); U.friends.push(t); T.friends.push(me); }
    else { U.out.push(t); T.inc.push(me); sendU(t, { t: 'toast', msg: U.name + ' درخواست دوستی فرستاد' }); toast(ws, 'درخواست فرستاده شد'); }
  } else if (m.t === 'facc') {
    if (!U.inc.includes(t)) return;
    drop(U.inc, t); drop(T.out, me); U.friends.push(t); T.friends.push(me);
  } else if (m.t === 'fdec') {
    drop(U.inc, t); if (T) drop(T.out, me);
  } else if (m.t === 'frem') {
    drop(U.friends, t); if (T) drop(T.friends, me);
  }
  save(); pushFL(me); pushFL(t);
}

/* ---------- دعوت به نبرد ---------- */
function endInv(inv, why) {
  clearTimeout(inv.timer); invOut.delete(inv.from); invIn.delete(inv.to);
  if (why) sendU(inv.from, { t: 'invend', why, who: nameOf(inv.to) });
  sendU(inv.to, { t: 'invgone' });
}
function invite(ws, m) {
  const me = ws.u, t = key(m.u);
  if (!db.users[me].friends.includes(t)) return toast(ws, 'فقط دوستانت را می‌توانی دعوت کنی');
  if (!conns.has(t)) return toast(ws, nameOf(t) + ' آنلاین نیست');
  if (inMatch.has(me)) return;
  if (inMatch.has(t)) return toast(ws, nameOf(t) + ' در حال بازی است');
  if (invOut.has(me)) return toast(ws, 'یک دعوت فعال داری');
  if (invIn.has(me)) return toast(ws, 'اول به دعوتِ دریافتی جواب بده');
  if (invIn.has(t) || invOut.has(t)) return toast(ws, nameOf(t) + ' الان مشغول است');
  const inv = { from: me, to: t, timer: setTimeout(() => endInv(inv, 'timeout'), 30000) };
  invOut.set(me, inv); invIn.set(t, inv);
  sendU(t, { t: 'invin', from: nameOf(me) });
  send(ws, { t: 'invwait', to: nameOf(t) });
}

/* ---------- نبرد ---------- */
function newMatch(a, b) {
  const mt = { p: [a, b], log: [], g: 0, ended: false, abort: null, tmr: [null, null] };
  inMatch.set(a, mt); inMatch.set(b, mt);
  [a, b].forEach((k, i) => sendU(k, { t: 'match', me: i, opp: nameOf(i ? a : b) }));
  push(mt, { a: 'init', seed: seed() });
  [a, b].forEach(k => { pushFL(k); pushFriendsOf(k); });
}
function push(mt, c) {
  if (c.a === 'init') { mt.g++; mt.log = []; }
  if (mt.log.length > 6000) return;
  mt.log.push(c);
  const m = { t: 'cmd', g: mt.g, n: mt.log.length - 1, c };
  mt.p.forEach(k => sendU(k, m));
}
function resumeMatch(mt, k, ws) {
  const i = mt.p.indexOf(k); clearTimeout(mt.tmr[i]);
  send(ws, { t: 'match', me: i, opp: nameOf(mt.p[1 - i]) });
  send(ws, { t: 'hello', g: mt.g, log: mt.log });
  if (mt.abort) send(ws, mt.abort);
  send(ws, { t: 'opp', on: conns.has(mt.p[1 - i]) });
  sendU(mt.p[1 - i], { t: 'opp', on: true });
}
function abort(mt, winner, by, reason) {
  if (mt.ended) return;
  mt.ended = true; mt.abort = { t: 'abort', winner, by, reason };
  mt.p.forEach(k => sendU(k, mt.abort));
}
const CMDS = new Set(['cell', 'ab', 'shop', 'spc', 'cast', 'dr', 'to', 'end']);

function inGame(ws, m) {
  const me = ws.u, mt = inMatch.get(me); if (!mt) return;
  const i = mt.p.indexOf(me);
  if (m.t === 'cmd') {
    if (mt.ended || !m.c || !CMDS.has(m.c.a) || !mt.log.length) return;
    push(mt, m.c);
  } else if (m.t === 'h') {
    sendU(mt.p[1 - i], { t: 'h', g: m.g, n: m.n, h: m.h });
  } else if (m.t === 'forfeit') {
    abort(mt, 1 - i, i, 'forfeit');
  } else if (m.t === 'leave') {
    clearTimeout(mt.tmr[i]); inMatch.delete(me);
    const o = mt.p[1 - i]; if (inMatch.get(o) === mt) sendU(o, { t: 'opp', on: false });
    pushFL(me); pushFriendsOf(me);
  }
}

/* ---------- WebSocket ---------- */
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 16 * 1024 });
wss.on('connection', ws => {
  ws.u = null; ws.tries = 0; ws.isAlive = true;
  ws.on('pong', () => (ws.isAlive = true));
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m.t !== 'string') return;
    if (m.t === 'auth' || m.t === 'resume') return auth(ws, m);
    if (!ws.u) return;
    const me = ws.u;
    switch (m.t) {
      case 'fadd': case 'facc': case 'fdec': case 'frem': return friends(ws, m);
      case 'inv': return invite(ws, m);
      case 'invcancel': { const v = invOut.get(me); if (v) endInv(v, 'cancel'); return; }
      case 'invdec': { const v = invIn.get(me); if (v && v.from === key(m.u)) endInv(v, 'declined'); return; }
      case 'invacc': {
        const v = invIn.get(me); if (!v || v.from !== key(m.u)) return;
        endInv(v, null);
        if (!conns.has(v.from) || inMatch.has(v.from) || inMatch.has(me)) return toast(ws, 'دعوت دیگر معتبر نیست');
        return newMatch(v.from, me);
      }
      case 'logout': delete db.sessions[ws.tok]; save(); return leaveSession(ws);
      case 'cmd': case 'h': case 'forfeit': case 'leave': return inGame(ws, m);
    }
  });
  ws.on('close', () => leaveSession(ws));
});
setInterval(() => wss.clients.forEach(w => { if (!w.isAlive) return w.terminate(); w.isAlive = false; w.ping(); }), 25000);

loadDb().then(() => server.listen(PORT, () => console.log('http://localhost:' + PORT)));
